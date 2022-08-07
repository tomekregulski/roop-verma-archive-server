const router = require('express').Router();
const controllers = require('../../../controllers/payments');
const isValidApiKey = require('../../../middleware/isValidateApiKey');
// const isValidJwt = require('../../../middleware/isValidJwt');
// const authMiddleware = require('../../middleware/middleware.verifyUserCookie');

const userRouter = router;

userRouter
  .route('/subscribe/:key')
  .post(isValidApiKey, controllers.post.subscribe);
userRouter
  .route('/cancel-subscription/:key')
  .post(isValidApiKey, controllers.post.cancelSubscription);
userRouter
  .route('/update-payment/:key')
  .put(isValidApiKey, controllers.put.updatePaymentMethod);

module.exports = userRouter;
