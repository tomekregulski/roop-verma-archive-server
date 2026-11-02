const router = require('express').Router();
const controllers = require('../../../controllers/payments');
const isValidApiKey = require('../../../middleware/isValidateApiKey');
const {
  noStore,
  browserGuard,
  requireSession,
  requireAdmin,
  customerOwner,
  checkoutOwner,
  subscriptionOwner,
} = require('../../../identity/http');
// Raw body is preserved in app.js; the controller authenticates before dispatch.
router.post('/webhooks', controllers.post.webhooks);
router.use(noStore);
const protectedRoute = [requireSession, browserGuard, isValidApiKey];
router.get(
  '/checkout-session/:key/:stripeId',
  ...protectedRoute,
  customerOwner((req) => req.params.stripeId),
  controllers.get.checkoutSession
);
router.get(
  '/checkout-session-resubscribe/:key/:stripeId',
  ...protectedRoute,
  customerOwner((req) => req.params.stripeId),
  controllers.get.checkoutSessionResubscribe
);
router.post(
  '/checkout-session-object/:key',
  ...protectedRoute,
  checkoutOwner,
  controllers.post.sessionObject
);
router.put(
  '/update-payment/:key',
  ...protectedRoute,
  customerOwner((req) => req.body.stripe_id),
  subscriptionOwner,
  controllers.put.updatePaymentMethod
);
router.get('/webhookLogs', requireSession, requireAdmin, controllers.get.webhookLogs);
module.exports = router;

// This candidate is not mounted by normal app/runtime composition.
module.exports.createPurchaseRouter = (purchase) => {
  const candidate = require('express').Router();
  const { wrap } = require('../../../identity/http');
  const { failure } = require('../../../identity/service');
  const handlers = controllers.post.createPurchaseHandlers(purchase);
  candidate.post('/webhooks', handlers.webhooks);
  candidate.use(noStore);
  candidate.get(
    '/account/:key',
    ...protectedRoute,
    wrap(async (req, res) => res.json(await purchase.account(req.identity.user.id)))
  );
  candidate.post(
    '/checkout/:key',
    ...protectedRoute,
    wrap(async (req, res) => {
      if (Object.keys(req.body).length) throw failure(400, 'Unexpected purchase input');
      res.json(await purchase.checkout(req.identity.user.id));
    })
  );
  candidate.post('/checkout-session-object/:key', ...protectedRoute, handlers.sessionObject);
  return candidate;
};
