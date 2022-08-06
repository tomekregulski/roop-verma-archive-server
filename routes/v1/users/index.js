const router = require('express').Router();
const controllers = require('../../../controllers/users');
// import { isValidApiKey } from '../../middleware/isValidateApiKey';
// const authMiddleware = require('../../middleware/middleware.verifyUserCookie');

const userRouter = router;

userRouter.route('/').get(controllers.get.allUsers);
userRouter.route('/check-existing').get(controllers.get.checkExistingUser);
userRouter.route('/').post(controllers.post.newUser);
userRouter.route('/update-password').put(controllers.put.updatePassword);
userRouter.route('/').delete(controllers.del.deleteUser);

module.exports = userRouter;
