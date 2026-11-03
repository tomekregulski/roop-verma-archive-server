// Acacia resource relationships only. Events are notifications, never evidence.
// Stripe relationship fields can contain an ID or an expanded resource object.
const API_VERSION = '2024-12-18.acacia';
const id = (value) => (typeof value === 'string' ? value : value?.id);
const subscriptionEnded = (status) => ['canceled', 'incomplete_expired'].includes(status);
function problem(code, status = 503) {
  return Object.assign(new Error('Billing service unavailable'), { code, status });
}
function check(condition, code) {
  if (!condition) throw problem(code);
}
function stripeDate(value) {
  if (!Number.isSafeInteger(value) || value <= 0 || value > 8640000000000) return null;
  const date = new Date(value * 1000);
  return Number.isFinite(date.getTime()) ? date : null;
}
function matchesMonthlyPrice(price, config) {
  return (
    price?.id === config.priceId &&
    id(price.product) === config.productId &&
    price.currency === config.currency &&
    price.recurring?.interval === 'month' &&
    price.recurring.interval_count === 1
  );
}
function hasUnsupportedBillingArrangement(subscription) {
  return Boolean(
    subscription.schedule ||
      subscription.pause_collection ||
      subscription.pending_update ||
      subscription.discount ||
      subscription.discounts?.length ||
      subscription.trial_start ||
      subscription.trial_end
  );
}
const knownSubscriptionStatuses = [
  'active',
  'past_due',
  'canceled',
  'incomplete',
  'incomplete_expired',
  'unpaid',
  'paused',
  'trialing',
];
function subscriptionIssue(subscription, customerId, config) {
  if (id(subscription.customer) !== customerId || subscription.livemode !== config.livemode)
    return 'ASSOCIATION_CONFLICT';
  const items = subscription.items;
  if (!items || items.has_more !== false || items.data?.length !== 1)
    return 'UNSUPPORTED_SUBSCRIPTION';
  const item = items.data[0];
  if (item.quantity !== 1 || !matchesMonthlyPrice(item.price, config))
    return 'UNSUPPORTED_SUBSCRIPTION';
  if (
    hasUnsupportedBillingArrangement(subscription) ||
    ['paused', 'trialing'].includes(subscription.status)
  )
    return 'UNSUPPORTED_SUBSCRIPTION';
  if (!knownSubscriptionStatuses.includes(subscription.status)) return 'UNKNOWN_LIFECYCLE';
  return null;
}
module.exports = {
  API_VERSION,
  id,
  subscriptionEnded,
  problem,
  check,
  stripeDate,
  subscriptionIssue,
  matchesMonthlyPrice,
};
