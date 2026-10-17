const router = require('express').Router();
const controllers = require('../../../controllers/user');
const isValidApiKey = require('../../../middleware/isValidateApiKey');
const { wrap, noStore, browserGuard, requireSession, requireAdmin, customerOwner } = require('../../../identity/http');
const { identity } = require('../../../identity/runtime');
router.use(noStore);
router.get('/:key', requireSession, isValidApiKey, requireAdmin, controllers.get.getAll);
router.post('/:key', browserGuard, isValidApiKey,
  wrap(async (req, _res, next) => { await identity.limit('register-ip', req.ip, 10, 3600000); next(); }), controllers.post.newUser);
// Permanently remove the testing-only bulk deletion API.
router.delete('/all/:key', (_req, res) => res.status(410).json({ error: { message: 'Bulk deletion API removed' } }));
router.get('/find-by-stripe-id/:key', requireSession, isValidApiKey,
  customerOwner(req => req.query.stripeId), controllers.get.checkExisting);
router.post('/create-portal-session/:key', requireSession, browserGuard, isValidApiKey,
  customerOwner(req => req.body.customerId), controllers.post.createPortalSession);
router.delete('/:key', requireSession, browserGuard, isValidApiKey, requireAdmin, controllers.del.deleteById);
module.exports = router;
