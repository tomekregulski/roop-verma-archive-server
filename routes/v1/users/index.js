const router = require('express').Router();
const controllers = require('../../../controllers/users');
const isValidApiKey = require('../../../middleware/isValidateApiKey');
const isValidJwt = require('../../../middleware/isValidJwt');

const userRouter = router;

userRouter.route('/:key').get(isValidApiKey, controllers.get.allUsers);
userRouter
  .route('/:id/:key')
  .get(isValidApiKey, isValidJwt, controllers.get.getUserById);
userRouter
  .route('/check-existing/:key')
  .get(isValidApiKey, controllers.get.checkExistingUser);
userRouter.route('/').post(isValidApiKey, controllers.post.newUser);
userRouter
  .route('/update-password/:key')
  .put(isValidApiKey, isValidJwt, controllers.put.updatePassword);
userRouter.route('/:key').delete(isValidApiKey, controllers.del.deleteUser);

module.exports = userRouter;
