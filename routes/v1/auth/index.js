const router = require('express').Router();
const controllers = require('../../../controllers/auth');
const { noStore, browserGuard, requireSession } = require('../../../identity/http');
router.use(noStore);
router.post('/login', browserGuard, controllers.post.login);
router.post('/verify', browserGuard, controllers.post.verify);
router.get('/session', requireSession, controllers.get.session);
router.post('/logout', browserGuard, controllers.post.logout);
router.get(['/email-token/:key/:email', '/session-token/:key/:email/:emailToken',
  '/account-update-token/:key/:email/:accoutUpdateKey', '/admin-token/:key'], controllers.get.retired);
module.exports = router;
