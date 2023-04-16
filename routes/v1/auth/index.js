const router = require('express').Router();
const controllers = require('../../../controllers/auth');
const isValidApiKey = require('../../../middleware/isValidateApiKey');

const authRoutes = router;

authRoutes.route('/test/:key').get(isValidApiKey, controllers.get.test);
authRoutes.route('/login/:key').post(isValidApiKey, controllers.post.login);
authRoutes.route('/logout/:key').post(isValidApiKey, controllers.post.logout);

module.exports = authRoutes;
