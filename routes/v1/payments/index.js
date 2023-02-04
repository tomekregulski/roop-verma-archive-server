const router = require('express').Router();
const controllers = require('../../../controllers/payment');
const isValidApiKey = require('../../../middleware/isValidateApiKey');
const isValidJwt = require('../../../middleware/isValidJwt');

const userRouter = router;

userRouter
  .route('/subscribe/:key')
  .post(isValidApiKey, controllers.post.subscribe);
userRouter
  .route('/resubscribe/:key')
  .post(isValidApiKey, isValidJwt, controllers.post.subscribe);
userRouter
  .route('/cancel-subscription/:key')
  .post(isValidApiKey, isValidJwt, controllers.post.cancelSubscription);
userRouter
  .route('/update-payment/:key')
  .put(isValidApiKey, isValidJwt, controllers.put.updatePaymentMethod);

module.exports = userRouter;
