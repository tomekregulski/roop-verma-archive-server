const router = require('express').Router();
const controllers = require('../../../controllers/user');
const isValidApiKey = require('../../../middleware/isValidateApiKey');
// const isValidJwt = require('../../../middleware/isValidJwt');

const userRouter = router;

userRouter.route('/:key').post(isValidApiKey, controllers.post.newUser);
userRouter
  .route('/:key')
  .delete(isValidApiKey, controllers.del.TESTING_ONLY_deleteAllUsers);
userRouter.route('/get-all').get(controllers.get.getAll);
userRouter
  .route('/create-portal-session/:key')
  .post(isValidApiKey, controllers.post.createPortalSession);
userRouter
  .route('/update-subscription-status/:key')
  .post(isValidApiKey, controllers.post.updateSubscriptionStatus);

module.exports = userRouter;
