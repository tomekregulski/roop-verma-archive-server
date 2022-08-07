const router = require('express').Router();
const controllers = require('../../../controllers/users');
const isValidApiKey = require('../../../middleware/isValidateApiKey');
// const authMiddleware = require('../../middleware/middleware.verifyUserCookie');

const userRouter = router;

userRouter.route('/:key').get(isValidApiKey, controllers.get.allUsers);
userRouter
  .route('/check-existing/:key')
  .get(isValidApiKey, controllers.get.checkExistingUser);
userRouter.route('/').post(isValidApiKey, controllers.post.newUser);
userRouter
  .route('/update-password/:key')
  .put(isValidApiKey, controllers.put.updatePassword);
userRouter.route('/:key').delete(isValidApiKey, controllers.del.deleteUser);

module.exports = userRouter;
