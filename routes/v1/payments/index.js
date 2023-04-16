const router = require('express').Router();
const controllers = require('../../../controllers/payments');
const isValidApiKey = require('../../../middleware/isValidateApiKey');
const isValidJwt = require('../../../middleware/isValidJwt');

const userRouter = router;

userRouter
  .route('/checkout-session/:key/:stripeId')
  .get(isValidApiKey, controllers.get.checkoutSession);

userRouter
  .route('/checkout-session-object/:key')
  .post(isValidApiKey, controllers.post.sessionObject);

userRouter
  .route('/update-payment/:key')
  .put(isValidApiKey, isValidJwt, controllers.put.updatePaymentMethod);

module.exports = userRouter;
