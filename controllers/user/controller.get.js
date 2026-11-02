const { db } = require('../../identity/runtime');
const { publicUser } = require('../../identity/service');
const { subscriptionEnded } = require('../../billing/evidence');
const { wrap } = require('../../identity/http');
module.exports = {
  checkExisting: wrap(async (req, res) => {
    const existingSubscription = await db.subscription.findMany({
      where: { userId: req.identity.user.id },
      orderBy: { id: 'asc' },
    });
    const current = (subscription) =>
      Boolean(subscription.acceptedAt) && !subscriptionEnded(subscription.status);
    existingSubscription.sort((a, b) => {
      const byCurrent = Number(current(b)) - Number(current(a));
      const byAdmission = (b.acceptedAt?.getTime() || 0) - (a.acceptedAt?.getTime() || 0);
      return byCurrent || byAdmission || a.id.localeCompare(b.id);
    });
    res.json({ existingUser: publicUser(req.identity.user), existingSubscription });
  }),
  getAll: wrap(async (_req, res) => {
    const users = await db.user.findMany({});
    res.json({ user: users.map(publicUser) });
  }),
};
