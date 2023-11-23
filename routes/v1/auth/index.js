const router = require('express').Router();
const controllers = require('../../../controllers/auth');
const isValidApiKey = require('../../../middleware/isValidateApiKey');
const isValidJwt = require('../../../middleware/isValidJwt');

const authRoutes = router;

authRoutes
  .route('/admin-token/:key')
  .get(isValidApiKey, controllers.get.adminToken);
authRoutes
  .route('/email-token/:key/:email')
  .get(isValidApiKey, controllers.get.emailToken);
authRoutes
  .route('/session-token/:key/:email/:emailToken')
  .get(isValidApiKey, controllers.get.sessionToken);
authRoutes
  .route('/account-update-token/:key/:email/:accoutUpdateKey')
  .get(isValidApiKey, controllers.get.accountUpdateToken);

module.exports = authRoutes;
