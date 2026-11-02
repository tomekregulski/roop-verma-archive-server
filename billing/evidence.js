// Acacia resource relationships only. Events are notifications, never evidence.
// Stripe relationship fields can contain an ID or an expanded resource object.
const API_VERSION = '2024-12-18.acacia';
const id = (value) => (typeof value === 'string' ? value : value?.id);
const subscriptionEnded = (status) => ['canceled', 'incomplete_expired'].includes(status);
const allowsExistingPaidCoverage = (status) =>
  ['active', 'past_due', 'canceled', 'trialing', 'paused'].includes(status);
function problem(code, status = 503) {
  return Object.assign(new Error('Billing synchronization unavailable'), { code, status });
}
function check(condition, code) {
  if (!condition) throw problem(code);
}
function stripeDate(value) {
  if (!Number.isSafeInteger(value) || value <= 0 || value > 8640000000000) return null;
  const date = new Date(value * 1000);
  return Number.isFinite(date.getTime()) ? date : null;
}
async function allPages(list, params = {}, maxPages = 30) {
  const rows = [],
    seen = new Set();
  let starting_after;
  for (let i = 0; i < maxPages; i++) {
    const result = await list({ ...params, limit: 100, ...(starting_after ? { starting_after } : {}) });
    check(result && Array.isArray(result.data) && typeof result.has_more === 'boolean', 'INCOMPLETE_PAGE');
    for (const row of result.data) {
      check(typeof row.id === 'string' && !seen.has(row.id), 'INCONSISTENT_PAGE');
      seen.add(row.id);
      rows.push(row);
    }
    if (!result.has_more) return rows;
    check(result.data.length > 0, 'INCOMPLETE_PAGE');
    starting_after = result.data.at(-1).id;
  }
  throw problem('PAGE_LIMIT');
}
function subscriptionIssue(subscription, customerId, config) {
  if (id(subscription.customer) !== customerId || subscription.livemode !== config.livemode)
    return 'ASSOCIATION_CONFLICT';
  const items = subscription.items;
  if (!items || items.has_more !== false || items.data?.length !== 1) return 'UNSUPPORTED_SUBSCRIPTION';
  const item = items.data[0],
    price = item.price;
  if (
    item.quantity !== 1 ||
    price?.id !== config.priceId ||
    id(price.product) !== config.productId ||
    price.currency !== config.currency ||
    price.recurring?.interval !== 'month' ||
    price.recurring.interval_count !== 1 ||
    subscription.schedule ||
    subscription.pause_collection ||
    subscription.pending_update ||
    subscription.discount ||
    subscription.discounts?.length ||
    subscription.trial_start ||
    subscription.trial_end
  )
    return 'UNSUPPORTED_SUBSCRIPTION';
  if (['paused', 'trialing'].includes(subscription.status)) return 'UNSUPPORTED_SUBSCRIPTION';
  if (
    ![
      'active',
      'past_due',
      'canceled',
      'incomplete',
      'incomplete_expired',
      'unpaid',
      'paused',
      'trialing',
    ].includes(subscription.status)
  )
    return 'UNKNOWN_LIFECYCLE';
  return null;
}
async function readInvoiceEvidence({ stripe, invoice, subscriptions, config, now, request }) {
  const subscription = subscriptions.find((subscription) => subscription.id === id(invoice.subscription));
  check(
    subscription &&
      id(invoice.customer) === id(subscription.customer) &&
      invoice.livemode === config.livemode,
    'ASSOCIATION_CONFLICT'
  );
  const lines = await allPages((params) => request(() => stripe.invoices.listLineItems(invoice.id, params)));
  let payment = null,
    charge = null,
    disputes = [],
    refunds = [];
  if (id(invoice.payment_intent)) {
    payment = await request(() => stripe.paymentIntents.retrieve(id(invoice.payment_intent)));
    if (id(payment.latest_charge)) {
      charge = await request(() => stripe.charges.retrieve(id(payment.latest_charge)));
      refunds = await allPages((params) => request(() => stripe.refunds.list(params)), { charge: charge.id });
      disputes = await allPages((params) => request(() => stripe.disputes.list(params)), {
        charge: charge.id,
      });
      check(
        charge.id === id(payment.latest_charge) &&
          id(charge.payment_intent) === payment.id &&
          id(charge.invoice) === invoice.id &&
          id(charge.customer) === id(invoice.customer) &&
          charge.livemode === config.livemode &&
          charge.currency === invoice.currency,
        'PAYMENT_ASSOCIATION'
      );
      check(
        refunds.every(
          (refund) =>
            id(refund.charge) === charge.id &&
            refund.currency === charge.currency &&
            Number.isSafeInteger(refund.amount) &&
            refund.amount > 0
        ),
        'REFUND_ASSOCIATION'
      );
      check(
        disputes.every(
          (dispute) =>
            id(dispute.charge) === charge.id &&
            dispute.livemode === config.livemode &&
            dispute.currency === charge.currency
        ),
        'DISPUTE_ASSOCIATION'
      );
      check(!charge.disputed || disputes.length > 0, 'MISSING_DISPUTE');
      const refundedAmount = refunds
        .filter((refund) => refund.status === 'succeeded')
        .reduce((sum, refund) => sum + refund.amount, 0);
      check(refundedAmount === charge.amount_refunded, 'REFUND_SNAPSHOT_CONFLICT');
      check(charge.refunded === (charge.amount_refunded === charge.amount), 'REFUND_SNAPSHOT_CONFLICT');
      check(
        Number.isSafeInteger(charge.amount_refunded) &&
          charge.amount_refunded >= 0 &&
          charge.amount_refunded <= charge.amount,
        'REFUND_SNAPSHOT_CONFLICT'
      );
    }
    check(
      payment.id === id(invoice.payment_intent) &&
        id(payment.invoice) === invoice.id &&
        id(payment.customer) === id(invoice.customer) &&
        payment.livemode === config.livemode &&
        payment.currency === invoice.currency,
      'PAYMENT_ASSOCIATION'
    );
  }
  const financial = { charge, disputes, refunds };
  const reject = (issue) => ({ invoice, subscription, issue, financial });
  if (
    disputes.some(
      (dispute) =>
        ![
          'needs_response',
          'under_review',
          'won',
          'lost',
          'warning_needs_response',
          'warning_under_review',
        ].includes(dispute.status)
    )
  )
    return reject('UNSUPPORTED_DISPUTE_RESOLUTION');
  if (subscriptionIssue(subscription, id(invoice.customer), config))
    return reject('UNSUPPORTED_SUBSCRIPTION');
  const unsupportedSettlement =
    !['subscription_create', 'subscription_cycle'].includes(invoice.billing_reason) ||
    invoice.collection_method !== 'charge_automatically' ||
    invoice.paid_out_of_band !== false ||
    invoice.starting_balance !== 0 ||
    ![0, null].includes(invoice.ending_balance) ||
    invoice.pre_payment_credit_notes_amount !== 0 ||
    invoice.post_payment_credit_notes_amount !== 0 ||
    invoice.discount ||
    invoice.discounts?.length ||
    invoice.total_discount_amounts?.length ||
    invoice.amount_due !== invoice.total ||
    invoice.subtotal !== invoice.total;
  if (unsupportedSettlement) return reject('UNSUPPORTED_SETTLEMENT');
  const unsettledInvoice =
    invoice.status !== 'paid' ||
    invoice.paid !== true ||
    !stripeDate(invoice.status_transitions?.finalized_at) ||
    !Number.isSafeInteger(invoice.amount_paid) ||
    invoice.amount_paid <= 0 ||
    invoice.total <= 0 ||
    invoice.amount_paid !== invoice.total ||
    invoice.amount_remaining !== 0;
  if (unsettledInvoice) return reject('NOT_SETTLED');
  if (lines.length !== 1) return reject('UNSUPPORTED_LINES');
  const line = lines[0],
    price = line.price;
  const unsupportedLine =
    line.type !== 'subscription' ||
    id(line.subscription) !== subscription.id ||
    line.proration !== false ||
    line.quantity !== 1 ||
    price?.id !== config.priceId ||
    id(price.product) !== config.productId ||
    price.recurring?.interval !== 'month' ||
    price.recurring.interval_count !== 1 ||
    line.currency !== config.currency ||
    price.currency !== config.currency ||
    line.amount !== invoice.total ||
    line.discount_amounts?.length ||
    invoice.currency !== config.currency;
  if (unsupportedLine) return reject('UNSUPPORTED_LINE');
  const serviceFrom = stripeDate(line.period?.start),
    serviceThrough = stripeDate(line.period?.end),
    settledAt = stripeDate(invoice.status_transitions?.paid_at);
  if (
    !serviceFrom ||
    !serviceThrough ||
    serviceThrough <= serviceFrom ||
    !settledAt ||
    settledAt > now ||
    stripeDate(invoice.status_transitions.finalized_at) > settledAt
  )
    return reject('INVALID_PERIOD');
  const insufficientPayment =
    !payment ||
    payment.status !== 'succeeded' ||
    payment.amount !== invoice.total ||
    payment.amount_received !== invoice.total ||
    !charge ||
    id(invoice.charge) !== charge.id ||
    charge.status !== 'succeeded' ||
    charge.paid !== true ||
    charge.captured !== true ||
    charge.amount !== invoice.total ||
    charge.amount_captured !== invoice.total;
  if (insufficientPayment) return reject('INSUFFICIENT_PAYMENT');
  return {
    invoice,
    subscription,
    financial,
    issue: null,
    grant: {
      invoiceId: invoice.id,
      invoiceLineId: line.id,
      subscriptionId: subscription.id,
      priceId: price.id,
      serviceFrom,
      serviceThrough,
      settledAt,
      paymentIntentId: payment.id,
      chargeId: charge.id,
      currency: invoice.currency,
      amountPaid: invoice.amount_paid,
    },
  };
}
function revocationState(financial, previous) {
  const { charge, disputes } = financial;
  if (previous?.invalidationReason === 'FULL_REFUND' || previous?.invalidationReason === 'DISPUTE_LOST')
    return { invalidationReason: previous.invalidationReason, disputeId: previous.disputeId };
  if (charge && charge.amount_refunded === charge.amount)
    return { invalidationReason: 'FULL_REFUND', disputeId: previous?.disputeId || null };
  const lost = disputes.find((dispute) => dispute.status === 'lost');
  if (lost) return { invalidationReason: 'DISPUTE_LOST', disputeId: lost.id };
  const open = disputes.find((dispute) => dispute.status !== 'won');
  if (open) return { invalidationReason: 'DISPUTE_OPEN', disputeId: open.id };
  // Absence never clears a previously observed hold. Stripe reports a withdrawn
  // dispute as won; an email or signed stale paid snapshot cannot restore access.
  if (
    previous?.invalidationReason &&
    !disputes.some((dispute) => dispute.id === previous.disputeId && dispute.status === 'won')
  )
    return { invalidationReason: previous.invalidationReason, disputeId: previous.disputeId };
  return { invalidationReason: null, disputeId: previous?.disputeId || null };
}
module.exports = {
  API_VERSION,
  id,
  subscriptionEnded,
  allowsExistingPaidCoverage,
  problem,
  check,
  stripeDate,
  allPages,
  subscriptionIssue,
  readInvoiceEvidence,
  revocationState,
};
