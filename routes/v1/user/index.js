const router = require('express').Router();
const controllers = require('../../../controllers/user');
const isValidApiKey = require('../../../middleware/isValidateApiKey');
// const isValidJwt = require('../../../middleware/isValidJwt');

const userRouter = router;

userRouter.route('/:key').post(isValidApiKey, controllers.post.newUser);
userRouter
  .route('/:key')
  .delete(isValidApiKey, controllers.del.TESTING_ONLY_deleteAllUsers);

module.exports = userRouter;
