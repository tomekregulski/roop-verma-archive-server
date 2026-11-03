const { failure } = require('./service');
const { wrap, requireSession, requireAdmin, browserGuard } = require('./http');
const apiKey = require('../middleware/isValidateApiKey');
function input(body, keys) {
  if (!body || Array.isArray(body) || Object.keys(body).some((k) => !keys.includes(k)))
    throw failure(400, 'Unexpected deletion input');
}
function account(req) {
  if (!/^[1-9][0-9]{0,14}$/.test(req.params.userId)) throw failure(400, 'Invalid account ID');
  const value = Number(req.params.userId);
  if (!Number.isSafeInteger(value)) throw failure(400, 'Invalid account ID');
  return value;
}
function mount(router, deletion) {
  const guarded = [requireSession, browserGuard, apiKey];
  router.post(
    '/account-deletion/:key',
    ...guarded,
    wrap(async (req, res) => {
      input(req.body, ['confirm']);
      if (req.body.confirm !== true)
        throw failure(400, 'Explicit deletion request confirmation required');
      res.json(await deletion.request(req.identity.user.id));
    })
  );
  router.get(
    '/owner/deletions/:key',
    ...guarded,
    requireAdmin,
    wrap(async (req, res) => res.json(await deletion.list(req.identity.user.id)))
  );
  router.get(
    '/owner/deletions/:userId/:key',
    ...guarded,
    requireAdmin,
    wrap(async (req, res) => res.json(await deletion.review(req.identity.user.id, account(req))))
  );
  router.post(
    '/owner/deletions/:userId/:action/:key',
    ...guarded,
    requireAdmin,
    wrap(async (req, res) => {
      const ownerId = req.identity.user.id,
        userId = account(req);
      let result;
      if (req.params.action === 'withdraw') {
        input(req.body, ['review']);
        result = await deletion.withdraw(ownerId, userId, req.body.review);
      } else if (req.params.action === 'complete') {
        input(req.body, ['review', 'dashboardClosed']);
        result = await deletion.complete(
          ownerId,
          userId,
          req.body.review,
          req.body.dashboardClosed
        );
      } else if (req.params.action === 'exact-session') {
        input(req.body, ['attempt', 'sessionId']);
        result = await deletion.recordExact(ownerId, userId, req.body.attempt, req.body.sessionId);
      } else throw failure(404, 'Unknown owner action');
      res.json(result);
    })
  );
}
module.exports = { mount };
