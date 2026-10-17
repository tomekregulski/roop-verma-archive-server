const { db } = require('../../identity/runtime');
const { publicUser } = require('../../identity/service');
const { wrap } = require('../../identity/http');
module.exports = {
  checkExisting: wrap(async (req, res) => {
    const existingSubscription = await db.subscription.findMany({ where: { userId: req.identity.user.id } });
    res.json({ existingUser: publicUser(req.identity.user), existingSubscription });
  }),
  getAll: wrap(async (_req, res) => {
    const users = await db.user.findMany({});
    res.json({ user: users.map(publicUser) });
  }),
};
