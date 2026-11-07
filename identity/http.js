const { config, identity } = require('./runtime');
const { failure } = require('./service');
const wrap = (handler) => (req, res, next) =>
  Promise.resolve()
    .then(() => {
      req.logOperation = `${req.method} ${req.baseUrl || ''}${
        req.route?.path || '/unmatched'
      }`;
      return handler(req, res, next);
    })
    .catch(next);
const noStore = (_req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
};
// Forms/images cannot supply this header; CORS allows only CLIENT_URL.
function browserGuard(req, _res, next) {
  if (
    (req.get('Origin') && req.get('Origin') !== config.clientOrigin) ||
    req.get('X-RVDL-CSRF') !== '1'
  )
    return next(failure(403, 'Request origin or CSRF header rejected'));
  next();
}
const requireSession = wrap(async (req, _res, next) => {
  const session = await identity.authenticate(req.cookies && req.cookies[config.cookieName]);
  req.identity = { user: session.user, session };
  next();
});
function requireAdmin(req, _res, next) {
  return req.identity.user.isAdmin === true
    ? next()
    : next(failure(403, 'Administrator access required'));
}
module.exports = { wrap, noStore, browserGuard, requireSession, requireAdmin };
