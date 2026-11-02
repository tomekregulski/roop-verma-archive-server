const { allowsExistingPaidCoverage } = require('./evidence');

function createEntitlementReader({ db, config, now = () => new Date() }) {
  return async function readEntitlement(userId) {
    const settings = typeof config === 'function' ? config() : config;
    if (typeof settings?.livemode !== 'boolean') throw new Error('Billing environment unavailable');
    // One repeatable-read snapshot covers ownership, lifecycle and all grants.
    const customerBinding = await db.$transaction(
      (tx) =>
        tx.billingCustomer.findUnique({
          where: { userId },
          include: { user: true, subscriptions: { include: { grants: true } } },
        }),
      { isolationLevel: 'RepeatableRead' }
    );
    if (!customerBinding) return null;
    const ownsCustomer =
      customerBinding.user &&
      customerBinding.userId === userId &&
      customerBinding.user.stripeId === customerBinding.customerId;
    if (!ownsCustomer || customerBinding.syncIssueCode === 'ASSOCIATION_CONFLICT')
      throw new Error('Billing association unavailable');
    if (customerBinding.deletedAt || customerBinding.livemode === null) return null;
    if (customerBinding.livemode !== settings.livemode) throw new Error('Billing environment unavailable');

    const time = now();
    let entitlement = null;
    for (const subscription of customerBinding.subscriptions) {
      if (
        subscription.stripeId !== customerBinding.customerId ||
        (subscription.userId !== null && subscription.userId !== userId)
      )
        throw new Error('Billing association unavailable');
      if (subscription.acceptedAt && subscription.livemode !== customerBinding.livemode)
        throw new Error('Billing environment unavailable');
      const eligible =
        subscription.acceptedAt &&
        subscription.syncedAt &&
        subscription.livemode === customerBinding.livemode &&
        allowsExistingPaidCoverage(subscription.status) &&
        !['ASSOCIATION_CONFLICT', 'UNKNOWN_LIFECYCLE'].includes(subscription.syncIssueCode);
      if (!eligible) continue;
      for (const grant of subscription.grants) {
        const paidFrom = new Date(Math.max(grant.serviceFrom.getTime(), grant.settledAt.getTime()));
        if (grant.invalidatedAt || !(paidFrom <= time && time < grant.serviceThrough)) continue;
        // Choose a containing interval; never join separate periods across a gap.
        if (!entitlement || grant.serviceThrough > entitlement.paidThrough) {
          entitlement = {
            kind: 'paid',
            userId,
            paidFrom,
            paidThrough: grant.serviceThrough,
            cancelled: subscription.status === 'canceled' || subscription.cancelAtPeriodEnd,
          };
        }
      }
    }
    return entitlement;
  };
}
module.exports = { createEntitlementReader };
