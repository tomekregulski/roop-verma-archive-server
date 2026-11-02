const { operations } = require('../../billing/runtime');
const { db } = require('../../identity/runtime');
const { wrap } = require('../../identity/http');
const checkout = wrap(async (req, res) => {
  const session = await operations.checkout(req.identity.user);
  res.json(session);
});
module.exports = {
  checkoutSession: checkout,
  checkoutSessionResubscribe: checkout,
  webhookLogs: wrap(async (_req, res) => {
    const logs = await db.stripeEventReceipt.findMany({ orderBy: { receivedAt: 'desc' }, take: 100 });
    res.json({ data: logs });
  }),
};
