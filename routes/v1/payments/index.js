const router = require('express').Router();
const handlers = require('../../../controllers/payments/controller.post');
const { purchase } = require('../../../billing/runtime');
const { wrap, noStore, browserGuard, requireSession } = require('../../../identity/http');
const { failure } = require('../../../identity/service');
const apiKey = require('../../../middleware/isValidateApiKey');
// app.js preserves the raw body; signature verification precedes all event dispatch.
router.post('/webhooks', handlers.webhooks);
router.use(noStore);
const protectedRoute = [requireSession, browserGuard, apiKey];
router.get(
  '/account/:key',
  ...protectedRoute,
  wrap(async (req, res) => res.json(await purchase.account(req.identity.user.id)))
);
router.post(
  '/checkout/:key',
  ...protectedRoute,
  wrap(async (req, res) => {
    if (Object.keys(req.body).length) throw failure(400, 'Unexpected purchase input');
    res.json(await purchase.checkout(req.identity.user.id));
  })
);
router.post('/checkout-session-object/:key', ...protectedRoute, handlers.sessionObject);
module.exports = router;
