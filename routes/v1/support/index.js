const router = require("express").Router();
const { noStore, browserGuard, wrap } = require("../../../identity/http");
const support = require("../../../support/runtime");

router.use(noStore);
router.post(
  "/",
  browserGuard,
  wrap(async function submitSupport(req, res) {
    const accepted = await support.send(req.body, req.ip);
    res.status(202).json(accepted);
  })
);

module.exports = router;
