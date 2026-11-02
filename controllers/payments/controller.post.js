const { stripe, billing } = require('../../billing/runtime');
const { wrap } = require('../../identity/http');

function verifiedWebhook(processEvent) {
  return wrap(async (req, res) => {
    const secret = process.env.STRIPE_WEBHOOK_SECRET;
    if (typeof secret !== 'string' || !secret.trim()) {
      return res.status(503).json({ error: { message: 'Webhook is not configured' } });
    }
    const signature = req.headers['stripe-signature'];
    if (!Buffer.isBuffer(req.body) || typeof signature !== 'string') {
      return res.status(400).json({ error: { message: 'Invalid webhook' } });
    }
    let event;
    try {
      // Verify the original bytes and timestamp before any processing. Never
      // return/log SDK errors: they can contain signatures and customer data.
      event = stripe.webhooks.constructEvent(req.body, signature, secret);
    } catch {
      return res.status(400).json({ error: { message: 'Invalid webhook' } });
    }
    await processEvent(event);
    res.json({ received: true });
  });
}
module.exports = {
  sessionObject: wrap(async (req, res) => {
    const session = await stripe.checkout.sessions.retrieve(req.body.sessionId);
    res.json(session);
  }),
  webhooks: verifiedWebhook((event) => billing.processEvent(event)),
  createPurchaseHandlers: (purchase) => ({
    webhooks: verifiedWebhook((event) => purchase.processEvent(event)),
    sessionObject: wrap(async (req, res) => {
      if (Object.keys(req.body).some((key) => key !== 'sessionId'))
        throw require('../../identity/service').failure(400, 'Unexpected purchase input');
      res.json(await purchase.confirm(req.identity.user.id, req.body.sessionId));
    }),
  }),
};
