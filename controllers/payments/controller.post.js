const { stripe, purchase } = require('../../billing/runtime');
const { wrap } = require('../../identity/http');
const { failure } = require('../../identity/service');

const webhooks = wrap(async (req, res) => {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (typeof secret !== 'string' || !secret.trim())
    return res.status(503).json({ error: { message: 'Webhook is not configured' } });
  const signature = req.headers['stripe-signature'];
  if (!Buffer.isBuffer(req.body) || typeof signature !== 'string')
    return res.status(400).json({ error: { message: 'Invalid webhook' } });
  let event;
  try {
    // Verify original bytes and timestamp before dispatch. Never expose SDK errors.
    event = stripe.webhooks.constructEvent(req.body, signature, secret);
  } catch {
    return res.status(400).json({ error: { message: 'Invalid webhook' } });
  }
  await purchase.processEvent(event);
  res.json({ received: true });
});
module.exports = {
  webhooks,
  sessionObject: wrap(async (req, res) => {
    if (Object.keys(req.body).some((key) => key !== 'sessionId'))
      throw failure(400, 'Unexpected purchase input');
    res.json(await purchase.confirm(req.identity.user.id, req.body.sessionId));
  }),
};
