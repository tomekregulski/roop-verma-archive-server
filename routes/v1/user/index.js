const router = require('express').Router();
const controllers = require('../../../controllers/user');
const apiKey = require('../../../middleware/isValidateApiKey');
const {
  wrap,
  noStore,
  browserGuard,
  requireSession,
  requireAdmin,
} = require('../../../identity/http');
const { identity } = require('../../../identity/runtime');
const { deletion } = require('../../../billing/runtime');
router.use(noStore);
router.get('/:key', requireSession, apiKey, requireAdmin, controllers.get.getAll);
router.post(
  '/:key',
  browserGuard,
  apiKey,
  wrap(async (req, _res, next) => {
    await identity.limit('register-ip', req.ip, 10, 3600000);
    next();
  }),
  controllers.post.newUser
);
router.post(
  '/create-portal-session/:key',
  requireSession,
  browserGuard,
  apiKey,
  controllers.post.createPortalSession
);
require('../../../identity/deletion-http').mount(router, deletion);
module.exports = router;
