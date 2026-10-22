const router = require('express').Router();
const controllers = require('../../../controllers/payments');
const isValidApiKey = require('../../../middleware/isValidateApiKey');
const { noStore, browserGuard, requireSession, requireAdmin, customerOwner, checkoutOwner, subscriptionOwner } = require('../../../identity/http');
// Raw body is preserved in app.js; the controller authenticates before dispatch.
router.post('/webhooks', controllers.post.webhooks);
router.use(noStore);
const protectedRoute = [requireSession, browserGuard, isValidApiKey];
router.get('/checkout-session/:key/:stripeId', ...protectedRoute,
  customerOwner(req => req.params.stripeId), controllers.get.checkoutSession);
router.get('/checkout-session-resubscribe/:key/:stripeId', ...protectedRoute,
  customerOwner(req => req.params.stripeId), controllers.get.checkoutSessionResubscribe);
router.post('/checkout-session-object/:key', ...protectedRoute, checkoutOwner, controllers.post.sessionObject);
router.put('/update-payment/:key', ...protectedRoute,
  customerOwner(req => req.body.stripe_id), subscriptionOwner, controllers.put.updatePaymentMethod);
router.get('/webhookLogs', requireSession, requireAdmin, controllers.get.webhookLogs);
module.exports = router;
