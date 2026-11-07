// D9 owner-assisted deletion. No financial mutations, discovery, retry worker or ledger.
const { failure } = require('../identity/service');
const { lockAccount } = require('../identity/account-lock');
const { digest, cleared, sessionId } = require('./purchase');
const { id, subscriptionEnded } = require('./evidence');
const conflict = (message) => {
  throw failure(409, message);
};
const identifier = (value) => Number.isSafeInteger(value) && value > 0;
const dashboardChecklist = [
  'Verify Stripe mode, customer and every owned attempt; email alone is insufficient.',
  'Resolve every Checkout outcome, including unassociated customers/subscriptions and duplicates.',
  'All subscriptions must actually be closed. Scheduled period-end cancellation is not closure.',
  'Review schedules, draft/open invoices, retries and pending invoice items; explicitly dispose of each.',
  'Handle D3–D8 refund/cancellation/dispute exceptions in Dashboard. Refund alone does not cancel.',
  'Recheck Dashboard immediately before completion. App deletion preserves Stripe financial records and already-issued media URLs may remain valid until expiry.',
];
function createDeletion({ db, purchase, now = () => new Date() }) {
  const { trusted, validateSession, retrieve, provider, settings } = purchase.deletionChecks;
  async function admin(database, ownerId) {
    if ((await database.user.findUnique({ where: { id: ownerId } }))?.isAdmin !== true)
      throw failure(403, 'Administrator access required');
  }
  async function snapshot(database, userId) {
    if (!identifier(userId)) throw failure(400, 'Invalid account ID');
    const user = await database.user.findUnique({ where: { id: userId } });
    if (!user) return null;
    const binding = await database.billingCustomer.findUnique({
      where: { userId },
    });
    // Include inactive and legacy-owned records. Missing/unsupported evidence is a blocker.
    const owned =
      user.stripeId && binding?.customerId === user.stripeId
        ? { OR: [{ userId }, { customerId: user.stripeId }] }
        : { userId };
    const attempts = await database.billingOperation.findMany({
      where: owned,
      orderBy: { id: 'asc' },
    });
    // C1 migration refuses all historical Subscription/CheckoutOwnership rows.
    // Every purchase remaining here is an owned immutable attempt; none is discarded.
    return { user, binding, attempts };
  }
  async function initiate(ownerId, userId, accountEmail, ownershipConfirmed) {
    await admin(db, ownerId);
    if (ownershipConfirmed !== true || typeof accountEmail !== 'string')
      throw failure(
        400,
        'Verify the support request belongs to this account first'
      );
    return db.$transaction(async (tx) => {
      await lockAccount(tx, userId);
      await admin(tx, ownerId);
      const state = await snapshot(tx, userId);
      if (!state) throw failure(404, 'Account not found');
      if (state.user.email.toLowerCase() !== accountEmail.trim().toLowerCase())
        throw failure(
          409,
          'Account email does not match; check the support request'
        );
      if (!state.user.deletionRequestedAt)
        await tx.user.update({
        where: { id: userId },
        data: {
          deletionRequestedAt: now(),
          deletionRevision: { increment: 1 },
          },
        });
      return { pending: true };
    });
  }
  async function closure(state) {
    const blockers = [],
      outcomes = [],
      customers = new Set(),
      subscriptions = new Map();
    const addCustomer = (customerId) => {
      if (!customerId) return;
      if (!/^cus_[A-Za-z0-9_]+$/.test(customerId))
        conflict('Invalid billing reference; investigation required');
      customers.add(customerId);
    };
    const addSubscription = (subscriptionId, customerId) => {
      if (!subscriptionId) return;
      if (!/^sub_[A-Za-z0-9_]+$/.test(subscriptionId) || !customerId)
        conflict('Invalid subscription reference');
      addCustomer(customerId);
      if (subscriptions.has(subscriptionId) && subscriptions.get(subscriptionId) !== customerId)
        conflict('Conflicting subscription ownership');
      subscriptions.set(subscriptionId, customerId);
    };
    const b = state.binding;
    if (state.user.stripeId && (!b || b.customerId !== state.user.stripeId))
      blockers.push('untrusted_customer_binding');
    if (b) {
      if (b.livemode !== settings().livemode || b.deletedAt)
        blockers.push('binding_requires_investigation');
      addCustomer(b.customerId);
      addSubscription(b.selectedSubscriptionId, b.customerId);
    }
    for (const op of state.attempts) {
      const outcome = {
        attempt: op.id,
        sessionId: op.externalId,
        status: 'unknown',
        customerId: null,
        subscriptionId: null,
      };
      outcomes.push(outcome);
      if (op.userId && op.userId !== state.user.id) {
        blockers.push('attempt_ownership_conflict:' + op.id);
        continue;
      }
      try {
        trusted(op);
      } catch {
        blockers.push('unsupported_attempt:' + op.id);
        continue;
      }
      addCustomer(op.customerId);
      addSubscription(op.parameters.previousSelection, op.customerId);
      if (!op.externalId) {
        blockers.push('unknown_checkout:' + op.id);
        continue;
      }
      const session = await retrieve(op);
      try {
        validateSession(op, session);
      } catch {
        conflict('Checkout ownership validation failed');
      }
      outcome.status = session.status;
      outcome.customerId = id(session.customer) || null;
      outcome.subscriptionId = id(session.subscription) || null;
      addCustomer(outcome.customerId);
      addSubscription(outcome.subscriptionId, outcome.customerId);
      if (session.status === 'open') blockers.push('open_checkout:' + op.id);
      // A completed session with missing subscription is NOT proof of no purchase.
      if (session.status === 'complete' && (!outcome.customerId || !outcome.subscriptionId))
        blockers.push('incomplete_checkout_evidence:' + op.id);
    }
    for (const customerId of customers) {
      const owner = await db.billingCustomer.findUnique({
        where: { customerId },
      });
      if (owner && (owner.deletedAt || (owner.userId && owner.userId !== state.user.id)))
        blockers.push('customer_ownership_conflict:' + customerId);
      const customer = await provider(() => purchaseStripeCustomer(customerId));
      if (
        customer.id !== customerId ||
        (!customer.deleted && customer.livemode !== settings().livemode)
      )
        conflict('Customer mode/identity validation failed');
    }
    for (const [subscriptionId, customerId] of subscriptions) {
      const sub = await provider(() => purchaseStripeSubscription(subscriptionId));
      if (
        sub?.object !== 'subscription' ||
        sub.id !== subscriptionId ||
        id(sub.customer) !== customerId ||
        sub.livemode !== settings().livemode
      )
        conflict('Subscription ownership validation failed');
      if (!subscriptionEnded(sub.status)) blockers.push('ongoing_subscription:' + subscriptionId);
    }
    return {
      blockers,
      outcomes,
      customers: [...customers],
      subscriptions: [...subscriptions].map(([subscriptionId, customerId]) => ({
        subscriptionId,
        customerId,
      })),
    };
  }
  // Only exact reads supplied by the purchase composition; no provider history API.
  const purchaseStripeCustomer = purchase.deletionChecks.customer;
  const purchaseStripeSubscription = purchase.deletionChecks.subscription;
  async function review(ownerId, userId) {
    await admin(db, ownerId);
    const state = await snapshot(db, userId);
    if (!state?.user.deletionRequestedAt) throw failure(404, 'Pending deletion not found');
    let checked;
    try {
      checked = await closure(state);
    } catch (error) {
      if (![409, 503].includes(error.status)) throw error;
      // Local review/withdrawal stays available during provider trouble. These
      // references are explicitly unverified; completion still performs all reads.
      require('../handlers/log').logFailure('deletion.review', error);
      checked = {
        blockers: [
          error.status === 503 ? 'provider_unavailable' : 'billing_requires_investigation',
        ],
        outcomes: state.attempts.map((op) => ({
          attempt: op.id,
          sessionId: op.externalId,
          status: 'unverified',
          customerId: op.customerId,
          subscriptionId: null,
        })),
        customers: state.binding ? [state.binding.customerId] : [],
        subscriptions: [],
      };
    }
    return {
      account: {
        id: userId,
        email: state.user.email,
        firstName: state.user.firstName,
        lastName: state.user.lastName,
        requestedAt: state.user.deletionRequestedAt,
      },
      binding: state.binding
        ? {
            customerId: state.binding.customerId,
            subscriptionId: state.binding.selectedSubscriptionId,
            livemode: state.binding.livemode,
          }
        : null,
      attempts: checked.outcomes,
      customers: checked.customers,
      subscriptions: checked.subscriptions,
      blockers: checked.blockers,
      checklist: dashboardChecklist,
      review: digest(state),
    };
  }
  async function recordExact(ownerId, userId, attemptId, suppliedId) {
    await admin(db, ownerId);
    if (typeof attemptId !== 'string' || attemptId.length > 100 || !sessionId(suppliedId))
      throw failure(400, 'Invalid exact Checkout reference');
    const state = await snapshot(db, userId);
    if (!state?.user.deletionRequestedAt) conflict('Deletion is not pending');
    const op = state.attempts.find((row) => row.id === attemptId);
    if (!op) throw failure(403, 'Attempt access denied');
    trusted(op);
    const session = await provider(() => purchase.deletionChecks.session(suppliedId));
    try {
      validateSession(op, session);
    } catch {
      throw failure(400, 'Session does not match this immutable owned attempt');
    }
    await db.$transaction(async (tx) => {
      await lockAccount(tx, userId);
      await admin(tx, ownerId);
      const live = await snapshot(tx, userId);
      if (!live || digest(live) !== digest(state)) conflict('Account changed; refresh review');
      await tx.billingOperation.update({
        where: { id: op.id },
        data: { externalId: session.id },
      });
    });
    return { recorded: true };
  }
  async function withdraw(ownerId, userId, reviewToken) {
    await db.$transaction(async (tx) => {
      await lockAccount(tx, userId);
      await admin(tx, ownerId);
      const state = await snapshot(tx, userId);
      if (!state?.user.deletionRequestedAt || digest(state) !== reviewToken)
        conflict('Account changed; refresh review');
      await tx.user.update({
        where: { id: userId },
        data: {
          deletionRequestedAt: null,
          deletionRevision: { increment: 1 },
        },
      });
    });
    return { withdrawn: true };
  }
  async function complete(ownerId, userId, reviewToken, dashboardClosed) {
    await admin(db, ownerId);
    if (
      dashboardClosed !== true ||
      typeof reviewToken !== 'string' ||
      !/^[a-f0-9]{64}$/.test(reviewToken)
    )
      throw failure(400, 'Current review and explicit Dashboard closure confirmation required');
    const state = await snapshot(db, userId);
    // An ambiguous response may be retried; absence never recreates identity.
    if (!state) return { completed: true };
    if (!state.user.deletionRequestedAt || digest(state) !== reviewToken)
      conflict('Account changed; refresh review');
    const checked = await closure(state); // fresh exact reads, outside DB locks
    if (checked.blockers.length)
      conflict('Unresolved billing outcomes block completion; refresh review');
    await db.$transaction(async (tx) => {
      await lockAccount(tx, userId);
      await admin(tx, ownerId);
      const live = await snapshot(tx, userId);
      if (!live) return;
      if (digest(live) !== reviewToken) conflict('Account changed; refresh review');
      const deletedAt = now();
      for (const customerId of checked.customers) {
        const b = await tx.billingCustomer.findUnique({
          where: { customerId },
        });
        if (b && (b.deletedAt || (b.userId && b.userId !== userId)))
          conflict('Customer ownership changed');
        const selection =
          b?.selectedSubscriptionId ||
          checked.subscriptions.find((s) => s.customerId === customerId)?.subscriptionId ||
          null;
        const data = {
          deletedAt,
          userId: null,
          ...cleared,
          selectedSubscriptionId: selection,
          livemode: settings().livemode,
        };
        await tx.billingCustomer.upsert({
          where: { customerId },
          create: { customerId, ...data },
          update: data,
        });
      }
      for (const op of live.attempts) {
        const outcome = checked.outcomes.find((row) => row.attempt === op.id);
        // Tombstone before erasing immutable parameters. trusted() and event
        // dispatch reject deletedAt before considering the scrubbed request.
        await tx.billingOperation.update({
          where: { id: op.id },
          data: {
            deletedAt,
            userId: null,
            activeKey: null,
            parameters: {},
            digest: '',
            closureCustomerId: outcome.customerId,
            closureSubscriptionId: outcome.subscriptionId,
          },
        });
      }
      await tx.token.deleteMany({ where: { userId } }); // legacy Token has no FK
      // Verified cascading FKs revoke proofs and ALL sessions in this transaction.
      await tx.user.delete({ where: { id: userId } });
    });
    return { completed: true };
  }
  return { initiate, review, recordExact, withdraw, complete };
}
module.exports = { createDeletion, dashboardChecklist };
