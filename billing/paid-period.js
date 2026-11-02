const { id, stripeDate, subscriptionIssue } = require('./evidence');
const empty = (value) => value == null || (Array.isArray(value) && value.length === 0);

// D2 trusts the regular paid invoice, not a second payment/charge ledger. Refunds
// alone do not change this decision (D4/D5); terminal cancellation is a separate veto.
module.exports = function paidPeriod(subscription, invoice, config, time) {
  if (
    subscriptionIssue(subscription, id(subscription.customer), config) ||
    !['active', 'past_due'].includes(subscription.status) ||
    subscription.collection_method !== 'charge_automatically' ||
    !invoice
  )
    return null;
  const line = invoice.lines?.data?.[0];
  if (
    invoice.object !== 'invoice' ||
    !/^in_[A-Za-z0-9_]+$/.test(invoice.id) ||
    id(invoice.subscription) !== subscription.id ||
    id(invoice.customer) !== id(subscription.customer) ||
    invoice.livemode !== config.livemode ||
    invoice.currency !== config.currency ||
    !['subscription_create', 'subscription_cycle'].includes(invoice.billing_reason) ||
    invoice.collection_method !== 'charge_automatically' ||
    invoice.status !== 'paid' ||
    invoice.paid !== true ||
    invoice.paid_out_of_band !== false ||
    !Number.isSafeInteger(invoice.total) ||
    invoice.total <= 0 ||
    invoice.amount_paid !== invoice.total ||
    invoice.amount_due !== invoice.total ||
    invoice.subtotal !== invoice.total ||
    invoice.amount_remaining !== 0 ||
    invoice.starting_balance !== 0 ||
    ![0, null].includes(invoice.ending_balance) ||
    invoice.pre_payment_credit_notes_amount !== 0 ||
    invoice.discount ||
    !empty(invoice.discounts) ||
    !empty(invoice.total_discount_amounts) ||
    !Array.isArray(invoice.lines?.data) ||
    invoice.lines.has_more !== false ||
    invoice.lines.data.length !== 1 ||
    line.object !== 'line_item' ||
    !/^il_[A-Za-z0-9_]+$/.test(line.id) ||
    line.type !== 'subscription' ||
    id(line.subscription) !== subscription.id ||
    line.livemode !== config.livemode ||
    line.proration !== false ||
    line.quantity !== 1 ||
    line.amount !== invoice.total ||
    line.currency !== config.currency ||
    line.price?.currency !== config.currency ||
    line.price?.id !== config.priceId ||
    id(line.price?.product) !== config.productId ||
    line.price?.recurring?.interval !== 'month' ||
    line.price.recurring.interval_count !== 1 ||
    !empty(line.discount_amounts) ||
    !empty(line.discounts) ||
    !empty(line.pretax_credit_amounts)
  )
    return null;
  const start = stripeDate(line.period?.start),
    end = stripeDate(line.period?.end),
    paidAt = stripeDate(invoice.status_transitions?.paid_at),
    finalizedAt = stripeDate(invoice.status_transitions?.finalized_at);
  if (!start || !end || !paidAt || !finalizedAt || finalizedAt > paidAt || paidAt > time) return null;
  const paidFrom = new Date(Math.max(start.getTime(), paidAt.getTime()));
  return paidFrom <= time && time < end ? { paidFrom, paidThrough: end } : null;
};
