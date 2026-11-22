const router = require("express").Router();
const { noStore, browserGuard, wrap } = require("../../../identity/http");
const { config, identity } = require("../../../identity/runtime");
const { allowsTestEmail } = require("../../../identity/service");
const support = require("../../../support/runtime");

/** During TEST, only a verified session for an approved address can send support mail. */
async function approvedSupportSession(req) {
  try {
    const session = await identity.authenticate(req.cookies?.[config.cookieName]);
    return allowsTestEmail(config.testAccessEmails, session.user.email);
  } catch (error) {
    if (error.status === 401) return false;
    throw error;
  }
}

router.use(noStore);
router.post(
  "/",
  browserGuard,
  wrap(async function submitSupport(req, res) {
    if (config.testAccessEmails && !(await approvedSupportSession(req))) {
      return res.status(403).json({
        error: {
          code: "TEST_SUPPORT_RESTRICTED",
          message: "Support is only available to signed-in testers.",
        },
      });
    }
    const accepted = await support.send(req.body, req.ip);
    res.status(202).json(accepted);
  })
);

module.exports = router;
