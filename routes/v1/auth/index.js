const router = require('express').Router();
const controllers = require('../../../controllers/auth');
const isValidApiKey = require('../../../middleware/isValidateApiKey');
// const authMiddleware = require('../../middleware/middleware.verifyUserCookie');

const authRoutes = router;

authRoutes.route('/login/:key').post(isValidApiKey, controllers.post.login);
authRoutes.route('/logout/:key').post(isValidApiKey, controllers.post.logout);

module.exports = authRoutes;
