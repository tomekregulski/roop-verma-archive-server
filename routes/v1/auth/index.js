const router = require('express').Router();
const controllers = require('../../../controllers/auth');
// import { isValidApiKey } from '../../middleware/isValidateApiKey';
// const authMiddleware = require('../../middleware/middleware.verifyUserCookie');

const authRoutes = router;

authRoutes.route('/login').post(controllers.post.login);
authRoutes.route('/logout').post(controllers.post.logout);

module.exports = authRoutes;
