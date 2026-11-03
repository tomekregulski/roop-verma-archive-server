const { id, stripeDate, subscriptionIssue, matchesMonthlyPrice } = require('./evidence');
const empty = (value) => value == null || (Array.isArray(value) && value.length === 0);

function matchesInvoiceAssociation(invoice, subscription, config) {
  return (
    invoice.object === 'invoice' &&
    /^in_[A-Za-z0-9_]+$/.test(invoice.id) &&
    id(invoice.subscription) === subscription.id &&
    id(invoice.customer) === id(subscription.customer) &&
    invoice.livemode === config.livemode &&
    invoice.currency === config.currency
  );
}
function isPositiveAutomaticPayment(invoice) {
  const supportedOrigin =
    ['subscription_create', 'subscription_cycle'].includes(invoice.billing_reason) &&
    invoice.collection_method === 'charge_automatically';
  const paid =
    invoice.status === 'paid' && invoice.paid === true && invoice.paid_out_of_band === false;
  const amountsMatch =
    Number.isSafeInteger(invoice.total) &&
    invoice.total > 0 &&
    invoice.amount_paid === invoice.total &&
    invoice.amount_due === invoice.total &&
    invoice.subtotal === invoice.total &&
    invoice.amount_remaining === 0;
  return supportedOrigin && paid && amountsMatch;
}
function hasSupportedSettlement(invoice) {
  return (
    invoice.starting_balance === 0 &&
    [0, null].includes(invoice.ending_balance) &&
    invoice.pre_payment_credit_notes_amount === 0 &&
    !invoice.discount &&
    empty(invoice.discounts) &&
    empty(invoice.total_discount_amounts)
  );
}
function matchesRecurringLine(line, invoice, subscription, config) {
  const associated =
    line.object === 'line_item' &&
    /^il_[A-Za-z0-9_]+$/.test(line.id) &&
    line.type === 'subscription' &&
    id(line.subscription) === subscription.id &&
    line.livemode === config.livemode;
  const fullPrice =
    line.proration === false &&
    line.quantity === 1 &&
    line.amount === invoice.total &&
    line.currency === config.currency &&
    matchesMonthlyPrice(line.price, config);
  const unadjusted =
    empty(line.discount_amounts) && empty(line.discounts) && empty(line.pretax_credit_amounts);
  return associated && fullPrice && unadjusted;
}
function remainingPeriod(line, invoice, time) {
  const start = stripeDate(line.period?.start),
    end = stripeDate(line.period?.end),
    paidAt = stripeDate(invoice.status_transitions?.paid_at),
    finalizedAt = stripeDate(invoice.status_transitions?.finalized_at);
  if (!start || !end || !paidAt || !finalizedAt || finalizedAt > paidAt || paidAt > time)
    return null;
  const paidFrom = new Date(Math.max(start.getTime(), paidAt.getTime()));
  return paidFrom <= time && time < end ? { paidFrom, paidThrough: end } : null;
}

// D2 qualifies one current paid invoice and its original remaining period.
// Refunds alone do not revoke (D4/D5); terminal cancellation is a separate veto.
module.exports = function paidPeriod(subscription, invoice, config, time) {
  if (subscriptionIssue(subscription, id(subscription.customer), config)) return null;
  if (!['active', 'past_due'].includes(subscription.status)) return null;
  if (subscription.collection_method !== 'charge_automatically' || !invoice) return null;
  if (!matchesInvoiceAssociation(invoice, subscription, config)) return null;
  if (!isPositiveAutomaticPayment(invoice) || !hasSupportedSettlement(invoice)) return null;

  const lines = invoice.lines;
  if (!Array.isArray(lines?.data) || lines.has_more !== false || lines.data.length !== 1)
    return null;
  const line = lines.data[0];
  if (!matchesRecurringLine(line, invoice, subscription, config)) return null;
  return remainingPeriod(line, invoice, time);
};
