// Normal paid-access reader: shared bounded cache and terminal cancellation veto.
const { API_VERSION, id, check, stripeDate, matchesMonthlyPrice } = require('./evidence');
const MAX_FRESHNESS_MS = 15 * 60 * 1000;
const cleared = { cachedStatus: null, accessFreshUntil: null };

function createPaidAccess({ db, stripe, config, now = () => new Date() }) {
  const pending = new Map();
  const settings = () => {
    const value = typeof config === 'function' ? config() : config;
    check(
      value &&
        typeof value.livemode === 'boolean' &&
        value.priceId &&
        value.productId &&
        value.currency,
      'ACCESS_CONFIGURATION'
    );
    return value;
  };
  const policyKey = (value, row) =>
    JSON.stringify([
      'subscription-status-v2',
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
    const row = await db.billingCustomer.findUnique({ where: { userId }, include: { user: true },
    });
    if (!row) return null;
    check(row.user?.id === userId && row.user.stripeId === row.customerId, 'ACCESS_ASSOCIATION');
    check(row.livemode === config.livemode, 'ACCESS_MODE');
    if (
      row.deletedAt ||
      row.stripeDeletedAt ||
      row.selectedCanceledAt ||
      !row.selectedSubscriptionId
    )
      return null;
    check(/^sub_[A-Za-z0-9_]+$/.test(row.selectedSubscriptionId), 'ACCESS_SELECTION');
    return row;
  }

  function cached(row, key, time) {
    if (row.accessPolicyKey !== key || !row.accessCheckedAt || !row.accessFreshUntil) return null;
    const { cachedStatus, accessCheckedAt, accessFreshUntil } = row;
    check(
      ['active', 'past_due'].includes(cachedStatus) &&
        [accessCheckedAt, accessFreshUntil].every(
      (date) => date instanceof Date && Number.isFinite(date.getTime())
    ) &&
        accessFreshUntil > accessCheckedAt &&
      accessFreshUntil.getTime() <= accessCheckedAt.getTime() + MAX_FRESHNESS_MS, 'ACCESS_CACHE');
    if (
      !(
        accessCheckedAt <= time &&
        time < accessFreshUntil)
    )
      return null;
    return { kind: 'subscription',
      userId: row.userId,
      status: cachedStatus,
      checkedAt: accessCheckedAt,
      freshUntil: accessFreshUntil,
    };
  }

  async function cancel(customerId, subscriptionId, livemode) {
    await db.billingCustomer.updateMany({
      where: {
        customerId,
        selectedSubscriptionId: subscriptionId,
        livemode,
        selectedCanceledAt: null,
      },
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
    // Access checks only association, intended tier/mode and current status.
    // Purchase completion keeps its separate, stricter supported-purchase checks.
    const items = subscription.items;
    const allowed =
      items?.has_more === false &&
      Array.isArray(items.data) &&
      items.data.length === 1 &&
      items.data[0]?.quantity === 1 &&
      matchesMonthlyPrice(items.data[0].price, config) &&
      ['active', 'past_due'].includes(subscription.status);
    check(now() >= started && now() - started < MAX_FRESHNESS_MS, 'ACCESS_READ_EXPIRED'
    );
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
        ...(allowed
          ? {
              cachedStatus: subscription.status,
              accessFreshUntil: new Date(started.getTime() + MAX_FRESHNESS_MS),
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
    const flightKey = JSON.stringify([
      userId,
      selected.customerId,
      selected.selectedSubscriptionId,
      key,
    ]);
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
    const supportedEvent =
      event.object === 'event' &&
      /^evt_[A-Za-z0-9_]+$/.test(event.id) &&
      stripeDate(event.created) &&
      event.api_version === API_VERSION &&
      event.livemode === config.livemode;
    check(supportedEvent, 'ACCESS_CANCEL_ENVELOPE');
    const canceledSelection =
      subscription?.object === 'subscription' &&
      /^sub_[A-Za-z0-9_]+$/.test(subscription.id) &&
      /^cus_[A-Za-z0-9_]+$/.test(id(subscription.customer)) &&
      subscription.status === 'canceled' &&
      subscription.livemode === config.livemode;
    check(canceledSelection, 'ACCESS_CANCEL_ENVELOPE');
    await cancel(id(subscription.customer), subscription.id, config.livemode);
  }
  return { readEntitlement, processEvent };
}
module.exports = { createPaidAccess, MAX_FRESHNESS_MS };
