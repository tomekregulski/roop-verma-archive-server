const { createHash } = require('node:crypto');
const createRequestBudget = require('./budget');
const {
  API_VERSION,
  id,
  subscriptionEnded,
  problem,
  check,
  stripeDate,
  allPages,
  subscriptionIssue,
  readInvoiceEvidence,
  revocationState,
} = require('./evidence');

const SUPPORTED = new Set([
  'invoice.paid',
  'invoice.payment_succeeded',
  'invoice.payment_failed',
  'invoice.payment_action_required',
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted',
  'customer.subscription.paused',
  'customer.subscription.resumed',
  'charge.refunded',
  'charge.dispute.created',
  'charge.dispute.updated',
  'charge.dispute.closed',
  'customer.created',
  'customer.updated',
  'customer.deleted',
]);
const retryableConflict = (error) => ['REVISION_CONFLICT', 'P2002', 'P2034'].includes(error.code);

// Every retry reruns work, including its provider reads. Reusing a stale snapshot
// after losing the customer revision would let old evidence overwrite a refund.
async function retryOnConflict(work) {
  for (let attempt = 0; attempt < 6; attempt++) {
    try {
      return await work();
    } catch (error) {
      if (!retryableConflict(error) || attempt === 5) throw error;
    }
  }
}

function chooseSubscriptions(subscriptions, previous, config) {
  const previousById = new Map(previous.map((subscription) => [subscription.id, subscription]));
  const ongoing = subscriptions.filter((subscription) => !subscriptionEnded(subscription.status));
  const alreadyAccepted = previous
    .filter(
      (subscription) => subscription.acceptedAt && ongoing.some((current) => current.id === subscription.id)
    )
    .sort((a, b) => a.acceptedAt - b.acceptedAt || a.id.localeCompare(b.id));
  const candidates = ongoing
    .filter(
      (subscription) =>
        !subscriptionIssue(subscription, id(subscription.customer), config) &&
        previousById.get(subscription.id)?.syncIssueCode !== 'DUPLICATE_SUBSCRIPTION'
    )
    .sort((a, b) => a.created - b.created || a.id.localeCompare(b.id));
  const currentId = alreadyAccepted[0]?.id || candidates[0]?.id;
  const admitted = new Set(
    previous.filter((subscription) => subscription.acceptedAt).map((subscription) => subscription.id)
  );
  if (currentId) admitted.add(currentId);

  // Canceled history is valid only when its lifetime does not overlap an
  // admitted subscription. A previously quarantined duplicate stays quarantined.
  const history = [...subscriptions].sort((a, b) => a.start_date - b.start_date || a.id.localeCompare(b.id));
  for (const subscription of history) {
    if (
      !subscriptionEnded(subscription.status) ||
      admitted.has(subscription.id) ||
      previousById.get(subscription.id)?.syncIssueCode === 'DUPLICATE_SUBSCRIPTION'
    )
      continue;
    const start = stripeDate(subscription.start_date);
    const end = stripeDate(subscription.ended_at);
    const overlaps = subscriptions
      .filter((other) => admitted.has(other.id))
      .some((other) => {
        const otherStart = stripeDate(other.start_date);
        const otherEnd = stripeDate(other.ended_at);
        return !otherStart || !(end <= otherStart || (otherEnd && otherEnd <= start));
      });
    if (start && end && start <= end && !overlaps) admitted.add(subscription.id);
  }
  return { previousById, admitted, currentId };
}

function createBilling({ db, stripe, config, now = () => new Date(), recoverCustomer }) {
  const settings = () => (typeof config === 'function' ? config() : config);

  async function binding(customerId, tx = db) {
    const customerBinding = await tx.billingCustomer.findUnique({
      where: { customerId },
      include: { user: true },
    });
    check(customerBinding, 'PENDING_ASSOCIATION');
    if (customerBinding.userId !== null) {
      check(customerBinding.user && customerBinding.user.stripeId === customerId, 'MAPPING_CONFLICT');
    }
    return customerBinding;
  }

  async function revise(tx, customerBinding, data = {}) {
    const result = await tx.billingCustomer.updateMany({
      where: { customerId: customerBinding.customerId, revision: customerBinding.revision },
      data: { ...data, revision: { increment: 1 } },
    });
    check(result.count === 1, 'REVISION_CONFLICT');
  }

  async function readSnapshot(customerBinding, { invoiceIds = [], subscriptionId }, request, config) {
    const customerId = customerBinding.customerId;
    const customer = await request(() => stripe.customers.retrieve(customerId));
    check(
      customer.id === customerId && (customer.deleted === true || customer.livemode === config.livemode),
      'ASSOCIATION_CONFLICT'
    );
    check(
      customerBinding.livemode === null || customerBinding.livemode === config.livemode,
      'BINDING_MODE_CONFLICT'
    );
    const subscriptions = await allPages((params) => request(() => stripe.subscriptions.list(params)), {
      customer: customerId,
      status: 'all',
    });
    check(
      subscriptions.every(
        (subscription) =>
          id(subscription.customer) === customerId && subscription.livemode === config.livemode
      ),
      'ASSOCIATION_CONFLICT'
    );

    if (subscriptionId) {
      const current = subscriptions.find((subscription) => subscription.id === subscriptionId);
      check(current, 'MISSING_SUBSCRIPTION');
      const relevant = await db.paidInvoiceGrant.findMany({
        where: { subscriptionId, serviceThrough: { gt: now() } },
      });
      invoiceIds = relevant.map((grant) => grant.invoiceId);
      if (id(current.latest_invoice)) invoiceIds.push(id(current.latest_invoice));
    }
    const invoices = [];
    for (const invoiceId of new Set(invoiceIds)) {
      const invoice = await request(() => stripe.invoices.retrieve(invoiceId));
      check(invoice.id === invoiceId && id(invoice.customer) === customerId, 'ASSOCIATION_CONFLICT');
      invoices.push(
        await readInvoiceEvidence({ stripe, invoice, subscriptions, config, now: now(), request })
      );
    }
    return { customer, subscriptions, invoices };
  }

  async function saveSubscriptions(tx, customerBinding, snapshot, config) {
    const previous = await tx.subscription.findMany({ where: { stripeId: customerBinding.customerId } });
    const { previousById, admitted, currentId } = chooseSubscriptions(
      snapshot.subscriptions,
      previous,
      config
    );
    const saved = new Map();
    let issue = null;
    // End old rows before admitting a replacement, to satisfy the partial unique index.
    const subscriptions = [...snapshot.subscriptions].sort(
      (a, b) =>
        Number(subscriptionEnded(b.status)) - Number(subscriptionEnded(a.status)) || a.id.localeCompare(b.id)
    );
    for (const subscription of subscriptions) {
      const existing = await tx.subscription.findUnique({ where: { id: subscription.id } });
      check(!existing || existing.stripeId === customerBinding.customerId, 'MAPPING_CONFLICT');
      const previousSubscription = previousById.get(subscription.id);
      const duplicate =
        previousSubscription?.syncIssueCode === 'DUPLICATE_SUBSCRIPTION' ||
        (!previousSubscription?.acceptedAt && !admitted.has(subscription.id));
      const syncIssueCode =
        subscriptionIssue(subscription, customerBinding.customerId, config) ||
        (duplicate ? 'DUPLICATE_SUBSCRIPTION' : null);
      issue ||= syncIssueCode;
      const price = subscription.items?.data?.[0]?.price;
      const canAdmit =
        !syncIssueCode &&
        admitted.has(subscription.id) &&
        !customerBinding.deletedAt &&
        !snapshot.customer.deleted;
      const data = {
        name: id(price?.product) || 'unverified',
        stripeId: customerBinding.customerId,
        userId: customerBinding.userId,
        priceId: price?.id || 'unverified',
        productId: id(price?.product) || 'unverified',
        status: subscription.status,
        livemode: config.livemode,
        cancelAtPeriodEnd: subscription.cancel_at_period_end === true,
        canceledAt: stripeDate(subscription.canceled_at),
        endedAt: stripeDate(subscription.ended_at),
        cancelAt: subscription.cancel_at ? String(subscription.cancel_at) : null,
        syncedAt: now(),
        acceptedAt: previousSubscription?.acceptedAt || (canAdmit ? now() : null),
        syncIssueCode,
      };
      saved.set(
        subscription.id,
        await tx.subscription.upsert({
          where: { id: subscription.id },
          create: { id: subscription.id, ...data },
          update: data,
        })
      );
    }
    const accepted = [...saved.values()].filter((subscription) => subscription.acceptedAt);
    const display =
      accepted.find((subscription) => subscription.id === currentId) ||
      accepted.sort((a, b) => b.acceptedAt - a.acceptedAt)[0];
    return { saved, displayStatus: display?.status || null, issue };
  }

  async function saveInvoice(tx, evidence, customerBinding, subscription, customer) {
    const existing = await tx.paidInvoiceGrant.findUnique({ where: { invoiceId: evidence.invoice.id } });
    const grant = evidence.grant;
    const changedOriginalEvidence =
      grant &&
      existing &&
      Object.entries(grant).some(([field, value]) =>
        value instanceof Date ? existing[field]?.getTime() !== value.getTime() : existing[field] !== value
      );
    const canCreate =
      grant &&
      !changedOriginalEvidence &&
      subscription.acceptedAt &&
      !subscription.syncIssueCode &&
      !customerBinding.deletedAt &&
      customerBinding.userId !== null &&
      !customerBinding.stripeDeletedAt &&
      !customer.deleted;
    if (!existing && !canCreate) return evidence.issue;

    const revocation = revocationState(evidence.financial, existing);
    if (changedOriginalEvidence && !['FULL_REFUND', 'DISPUTE_LOST'].includes(revocation.invalidationReason)) {
      revocation.invalidationReason = 'EVIDENCE_CONFLICT';
    }
    const partialRefund = evidence.financial.charge?.amount_refunded > 0 && !revocation.invalidationReason;
    const reviewReason = partialRefund ? 'PARTIAL_REFUND' : evidence.issue;
    const updates = {
      ...revocation,
      invalidatedAt: revocation.invalidationReason ? existing?.invalidatedAt || now() : null,
      reviewReason: reviewReason || null,
      verifiedAt: now(),
    };
    if (existing)
      await tx.paidInvoiceGrant.update({ where: { invoiceId: existing.invoiceId }, data: updates });
    else await tx.paidInvoiceGrant.create({ data: { ...grant, ...updates } });
    return evidence.issue || (changedOriginalEvidence ? 'IMMUTABLE_EVIDENCE_CONFLICT' : null) || reviewReason;
  }

  async function applySnapshot(customerBinding, snapshot, { receipt, progress }, config) {
    // Only database work here. Customer revision, evidence, display and receipt
    // commit together; no provider request is made while holding this lock.
    return db.$transaction(async (tx) => {
      await revise(tx, customerBinding, {
        lastSyncedAt: now(),
        livemode: config.livemode,
        ...(snapshot.customer.deleted ? { stripeDeletedAt: customerBinding.stripeDeletedAt || now() } : {}),
        ...(progress || {}),
      });
      if (receipt) {
        const current = await tx.stripeEventReceipt.findUnique({ where: { eventId: receipt.eventId } });
        if (['applied', 'ignored'].includes(current.outcome)) return { outcome: current.outcome };
      }
      const subscriptions = await saveSubscriptions(tx, customerBinding, snapshot, config);
      let issue =
        customerBinding.deletedAt || customerBinding.userId === null
          ? 'ACCOUNT_TOMBSTONE'
          : subscriptions.issue;
      for (const evidence of snapshot.invoices.sort((a, b) => a.invoice.id.localeCompare(b.invoice.id))) {
        // Always apply every invoice, even if an earlier one already needs review.
        const invoiceIssue = await saveInvoice(
          tx,
          evidence,
          customerBinding,
          subscriptions.saved.get(evidence.subscription.id),
          snapshot.customer
        );
        issue ||= invoiceIssue;
      }
      if (customerBinding.userId !== null) {
        await tx.user.update({
          where: { id: customerBinding.userId },
          data: { subscriptionActive: subscriptions.displayStatus },
        });
      }
      const outcome = issue ? 'review' : 'applied';
      if (receipt)
        await tx.stripeEventReceipt.update({
          where: { eventId: receipt.eventId },
          data: { outcome, errorCode: issue, appliedAt: now() },
        });
      return { outcome, issue, invoices: snapshot.invoices.length };
    });
  }

  async function sync(customerId, options = {}) {
    const config = settings();
    const request = createRequestBudget();
    return retryOnConflict(async () => {
      const customerBinding = await binding(customerId);
      if (options.expectedCursor !== undefined && customerBinding.reconcileCursor !== options.expectedCursor)
        throw problem('RECONCILE_CURSOR_CONFLICT');
      const snapshot = await readSnapshot(customerBinding, options, request, config);
      if (!options.inspect) return applySnapshot(customerBinding, snapshot, options, config);
      const issues = [
        ...snapshot.invoices.map((evidence) => evidence.issue),
        ...snapshot.subscriptions.map((subscription) => subscriptionIssue(subscription, customerId, config)),
      ];
      if (snapshot.subscriptions.filter((subscription) => !subscriptionEnded(subscription.status)).length > 1)
        issues.push('MULTIPLE_ONGOING_SUBSCRIPTIONS');
      return {
        invoices: snapshot.invoices.length,
        qualifying: snapshot.invoices.filter((evidence) => evidence.grant).length,
        issues: [...new Set(issues.filter(Boolean))],
      };
    });
  }
  function envelope(event) {
    const original = event;
    event = event && typeof event === 'object' && !Array.isArray(event) ? event : {};
    const type = typeof event.type === 'string' ? event.type : '';
    const validString = (value) => typeof value === 'string' && /^[A-Za-z0-9_.-]{1,255}$/.test(value);
    const objectId = id(event.data?.object);
    const objectTypes = [
      ['invoice.', 'invoice'],
      ['customer.subscription.', 'subscription'],
      ['charge.dispute.', 'dispute'],
      ['charge.', 'charge'],
      ['customer.', 'customer'],
    ];
    const expectedObject = objectTypes.find(([prefix]) => type.startsWith(prefix))?.[1];
    const malformed =
      (expectedObject && event.data?.object?.object !== expectedObject) ||
      !validString(event.id) ||
      !validString(event.type) ||
      !validString(objectId) ||
      event.object !== 'event' ||
      !stripeDate(event.created);
    return {
      eventId: validString(event.id)
        ? event.id
        : 'malformed_' +
          createHash('sha256')
            .update(JSON.stringify(original) || 'null')
            .digest('hex'),
      type: validString(event.type) ? event.type : 'malformed',
      objectId: validString(objectId) ? objectId : '',
      apiVersion:
        typeof event.api_version === 'string' && event.api_version.length <= 64 ? event.api_version : null,
      livemode: typeof event.livemode === 'boolean' ? event.livemode : null,
      eventCreatedAt: stripeDate(event.created),
      malformed,
    };
  }
  async function dispatch(receipt, inspect = false) {
    const config = settings();
    const request = createRequestBudget();
    let customerId,
      invoiceIds = [],
      subscriptionId;
    const objectId = receipt.objectId;
    if (receipt.type.startsWith('invoice.')) {
      const invoice = await request(() => stripe.invoices.retrieve(objectId));
      customerId = id(invoice.customer);
      invoiceIds = [objectId];
    } else if (receipt.type.startsWith('customer.subscription.')) {
      const subscription = await request(() => stripe.subscriptions.retrieve(objectId));
      customerId = id(subscription.customer);
      subscriptionId = objectId;
    } else if (receipt.type.startsWith('charge.')) {
      let chargeId = objectId;
      if (receipt.type.startsWith('charge.dispute.'))
        chargeId = id((await request(() => stripe.disputes.retrieve(objectId))).charge);
      const charge = await request(() => stripe.charges.retrieve(chargeId));
      check(charge.livemode === config.livemode && id(charge.invoice), 'UNSUPPORTED_CHARGE');
      customerId = id(charge.customer);
      invoiceIds = [id(charge.invoice)];
    } else {
      customerId = objectId;
      if (receipt.type === 'customer.created' && recoverCustomer && !inspect)
        await recoverCustomer(customerId);
    }
    return sync(customerId, { invoiceIds, subscriptionId, receipt: inspect ? undefined : receipt, inspect });
  }
  async function processEvent(event, { replay = false } = {}) {
    const { malformed, ...data } = envelope(event);
    const receipt = await db.stripeEventReceipt.upsert({
      where: { eventId: data.eventId },
      create: data,
      update: {},
    });
    check(
      receipt.type === data.type &&
        receipt.objectId === data.objectId &&
        receipt.apiVersion === data.apiVersion &&
        receipt.livemode === data.livemode,
      'EVENT_CONFLICT'
    );
    if (!replay && ['applied', 'ignored', 'review'].includes(receipt.outcome)) return receipt.outcome;
    await db.stripeEventReceipt.update({
      where: { eventId: data.eventId },
      data: { attempts: { increment: 1 }, lastAttemptAt: now() },
    });
    const config = settings();
    let issue = null;
    if (malformed) issue = 'MALFORMED_ENVELOPE';
    else if (data.apiVersion !== API_VERSION) issue = 'UNSUPPORTED_VERSION';
    else if (data.livemode !== config.livemode) issue = 'MODE_MISMATCH';
    if (issue || !SUPPORTED.has(data.type)) {
      await db.stripeEventReceipt.update({
        where: { eventId: data.eventId },
        data: { outcome: issue ? 'review' : 'ignored', errorCode: issue, appliedAt: now() },
      });
      return issue ? 'review' : 'ignored';
    }
    try {
      return (await dispatch(receipt)).outcome;
    } catch (error) {
      // A pending receipt is not a queue guarantee. Always fail the HTTP request
      // so Stripe can retry; repair can also replay the durable routing hints.
      if (
        [
          'UNTRUSTED_CUSTOMER',
          'ACCOUNT_TOMBSTONE',
          'REGISTRATION_CONFLICT',
          'UNSUPPORTED_CHARGE',
          'MAPPING_CONFLICT',
          'BINDING_MODE_CONFLICT',
        ].includes(error.code)
      ) {
        await db.stripeEventReceipt.update({
          where: { eventId: receipt.eventId },
          data: { outcome: 'review', errorCode: error.code, appliedAt: now() },
        });
        return 'review';
      }
      await db.stripeEventReceipt.updateMany({
        where: { eventId: receipt.eventId, outcome: 'pending' },
        data: { errorCode: 'RETRY_REQUIRED' },
      });
      throw problem('RETRY_REQUIRED');
    }
  }
  async function replayReceipt(receipt, { inspect = false } = {}) {
    if (
      ['MALFORMED_ENVELOPE', 'UNSUPPORTED_VERSION', 'MODE_MISMATCH'].includes(receipt.errorCode) ||
      receipt.apiVersion !== API_VERSION ||
      receipt.livemode !== settings().livemode ||
      !SUPPORTED.has(receipt.type)
    )
      return { outcome: 'review' };
    if (!inspect)
      await db.stripeEventReceipt.update({
        where: { eventId: receipt.eventId },
        data: { attempts: { increment: 1 }, lastAttemptAt: now() },
      });
    return dispatch(receipt, inspect);
  }
  return { sync, processEvent, replayReceipt, binding, revise, settings };
}
module.exports = { createBilling, retryOnConflict };
