const router = require('express').Router();
const controllers = require('../../../controllers/payments');
const isValidApiKey = require('../../../middleware/isValidateApiKey');
const isValidJwt = require('../../../middleware/isValidJwt');

const userRouter = router;

userRouter
  .route('/checkout-session/:key/:stripeId')
  .get(isValidApiKey, controllers.get.checkoutSession);
userRouter
  .route('/checkout-session-resubscribe/:key/:stripeId')
  .get(isValidApiKey, controllers.get.checkoutSessionResubscribe);

userRouter
  .route('/checkout-session-object/:key')
  .post(isValidApiKey, controllers.post.sessionObject);

userRouter
  .route('/webhooks')
  .post(/*isValidApiKey, */ controllers.post.webhooks);

userRouter
  .route('/update-payment/:key')
  .put(isValidApiKey, isValidJwt, controllers.put.updatePaymentMethod);

userRouter.route('/webhookLogs').get(controllers.get.webhookLogs);

module.exports = userRouter;
