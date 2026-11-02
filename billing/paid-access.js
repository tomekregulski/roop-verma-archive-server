// Intentionally not imported by billing/runtime.js. This slice is exercised only
// by isolated HTTP/database fixtures until the owned-Checkout cutover is approved.
const { API_VERSION, id, check, stripeDate } = require('./evidence');
const paidPeriod = require('./paid-period');
const MAX_FRESHNESS_MS = 15 * 60 * 1000;
const cleared = { cachedPaidFrom: null, cachedPaidThrough: null, accessFreshUntil: null };

function createPaidAccess({ db, stripe, config, now = () => new Date() }) {
  const pending = new Map();
  const settings = () => {
    const value = typeof config === 'function' ? config() : config;
    check(
      value && typeof value.livemode === 'boolean' && value.priceId && value.productId && value.currency,
      'ACCESS_CONFIGURATION'
    );
    return value;
  };
  const policyKey = (value, row) =>
    JSON.stringify([
      'paid-access-v1',
      API_VERSION,
      value.priceId,
      value.productId,
      value.currency,
      value.livemode,
      row.userId,
      row.customerId,
      row.selectedSubscriptionId,
    ]);
  const sameSelection = (a, b) =>
    a &&
    b &&
    a.userId === b.userId &&
    a.customerId === b.customerId &&
    a.selectedSubscriptionId === b.selectedSubscriptionId &&
    a.livemode === b.livemode;

  async function binding(userId, config) {
    const row = await db.billingCustomer.findUnique({ where: { userId }, include: { user: true } });
    if (!row) return null;
    check(row.user?.id === userId && row.user.stripeId === row.customerId, 'ACCESS_ASSOCIATION');
    check(row.livemode === config.livemode, 'ACCESS_MODE');
    if (row.deletedAt || row.stripeDeletedAt || row.selectedCanceledAt || !row.selectedSubscriptionId)
      return null;
    check(/^sub_[A-Za-z0-9_]+$/.test(row.selectedSubscriptionId), 'ACCESS_SELECTION');
    return row;
  }

  function cached(row, key, time) {
    if (row.accessPolicyKey !== key || !row.accessCheckedAt || !row.accessFreshUntil) return null;
    const {
      cachedPaidFrom: paidFrom,
      cachedPaidThrough: paidThrough,
      accessCheckedAt,
      accessFreshUntil,
    } = row;
    check(
      [paidFrom, paidThrough, accessCheckedAt, accessFreshUntil].every(
        (date) => date instanceof Date && Number.isFinite(date.getTime())
      ) &&
        paidFrom < paidThrough &&
        accessFreshUntil <= paidThrough &&
        accessFreshUntil.getTime() <= accessCheckedAt.getTime() + MAX_FRESHNESS_MS,
      'ACCESS_CACHE'
    );
    if (!(accessCheckedAt <= time && time < accessFreshUntil && paidFrom <= time && time < paidThrough))
      return null;
    return { kind: 'paid', userId: row.userId, paidFrom, paidThrough };
  }

  async function cancel(customerId, subscriptionId, livemode) {
    await db.billingCustomer.updateMany({
      where: { customerId, selectedSubscriptionId: subscriptionId, livemode, selectedCanceledAt: null },
      data: { selectedCanceledAt: now(), ...cleared },
    });
  }

  async function refresh(row, config, key) {
    const started = now();
    const subscription = await stripe.subscriptions.retrieve(row.selectedSubscriptionId);
    check(
      subscription?.object === 'subscription' &&
        subscription.id === row.selectedSubscriptionId &&
        id(subscription.customer) === row.customerId &&
        subscription.livemode === config.livemode,
      'ACCESS_SUBSCRIPTION_ASSOCIATION'
    );
    if (subscription.status === 'canceled') {
      await cancel(row.customerId, subscription.id, config.livemode);
      return started;
    }
    const invoices = await stripe.invoices.list({
      customer: row.customerId,
      subscription: subscription.id,
      status: 'paid',
      limit: 1,
    });
    check(
      Array.isArray(invoices?.data) &&
        invoices.data.length <= 1 &&
        typeof invoices.has_more === 'boolean' &&
        (!invoices.has_more || invoices.data.length > 0),
      'ACCESS_INVOICE_PAGE'
    );
    const period = paidPeriod(subscription, invoices.data[0], config, now());
    check(now() >= started && now() - started < MAX_FRESHNESS_MS, 'ACCESS_READ_EXPIRED');
    const freshUntil =
      period && new Date(Math.min(started.getTime() + MAX_FRESHNESS_MS, period.paidThrough.getTime()));
    // No global customer revisions or retry loop. A discarded fill rereads the
    // shared winner; cancellation and selection changes always veto old results.
    await db.billingCustomer.updateMany({
      where: {
        customerId: row.customerId,
        userId: row.userId,
        livemode: row.livemode,
        selectedSubscriptionId: row.selectedSubscriptionId,
        selectedCanceledAt: null,
        deletedAt: null,
        stripeDeletedAt: null,
        OR: [{ accessCheckedAt: null }, { accessCheckedAt: { lt: started } }],
      },
      data: {
        accessCheckedAt: started,
        accessPolicyKey: key,
        ...(period
          ? {
              cachedPaidFrom: period.paidFrom,
              cachedPaidThrough: period.paidThrough,
              accessFreshUntil: freshUntil,
            }
          : cleared),
      },
    });
    return started;
  }

  async function readEntitlement(userId) {
    const config = settings();
    const selected = await binding(userId, config);
    if (!selected) return null;
    const key = policyKey(config, selected);
    const hit = cached(selected, key, now());
    if (hit) return hit;
    const flightKey = JSON.stringify([userId, selected.customerId, selected.selectedSubscriptionId, key]);
    if (!pending.has(flightKey)) {
      const work = refresh(selected, config, key).finally(() => pending.delete(flightKey));
      pending.set(flightKey, work);
    }
    const started = await pending.get(flightKey);
    const current = await binding(userId, config);
    if (!sameSelection(selected, current)) return null;
    const result = cached(current, key, now());
    if (result) return result;
    if (
      current.accessPolicyKey === key &&
      current.accessCheckedAt >= started &&
      current.accessFreshUntil === null
    )
      return null;
    check(false, 'ACCESS_REFRESH_CONFLICT');
  }

  // Caller must use the existing raw-body signature verifier first. Signed events
  // can only add a terminal veto, never provision identity or grant/restore access.
  async function processEvent(event) {
    if (event?.type !== 'customer.subscription.deleted') return;
    const config = settings(),
      subscription = event.data?.object;
    check(
      event.object === 'event' &&
        /^evt_[A-Za-z0-9_]+$/.test(event.id) &&
        stripeDate(event.created) &&
        event.api_version === API_VERSION &&
        event.livemode === config.livemode &&
        subscription?.object === 'subscription' &&
        /^sub_[A-Za-z0-9_]+$/.test(subscription.id) &&
        /^cus_[A-Za-z0-9_]+$/.test(id(subscription.customer)) &&
        subscription.status === 'canceled' &&
        subscription.livemode === config.livemode,
      'ACCESS_CANCEL_ENVELOPE'
    );
    await cancel(id(subscription.customer), subscription.id, config.livemode);
  }
  return { readEntitlement, processEvent };
}
module.exports = { createPaidAccess, MAX_FRESHNESS_MS };
