const { db, config, identity } = require('./runtime');
const { failure } = require('./service');
const wrap = handler => (req, res, next) => Promise.resolve().then(() => handler(req, res, next)).catch(next);
const noStore = (_req, res, next) => { res.set('Cache-Control', 'no-store'); next(); };
// Also required on legacy GETs that create Stripe sessions. Forms/images cannot
// supply this header; CORS allows only CLIENT_URL. Header value is not a secret.
function browserGuard(req, _res, next) {
  if ((req.get('Origin') && req.get('Origin') !== config.clientOrigin) || req.get('X-RVDL-CSRF') !== '1') return next(failure(403, 'Request origin or CSRF header rejected'));
  next();
}
const requireSession = wrap(async (req, _res, next) => {
  const session = await identity.authenticate(req.cookies && req.cookies[config.cookieName]);
  req.identity = { user: session.user, session };
  next();
});
function requireAdmin(req, _res, next) {
  return req.identity.user.isAdmin === true ? next() : next(failure(403, 'Administrator access required'));
}
function customerOwner(read) {
  return (req, _res, next) => {
    const target = read(req);
    if (target !== undefined && (typeof target !== 'string' || target !== req.identity.user.stripeId)) return next(failure(403, 'Account access denied'));
    next();
  };
}
const checkoutOwner = wrap(async (req, _res, next) => {
  const id = req.body.sessionId;
  if (typeof id !== 'string' || id.length > 255 || !/^cs_[A-Za-z0-9_]+$/.test(id)) throw failure(400, 'Invalid session ID');
  const owner = await db.checkoutOwnership.findUnique({ where: { sessionId: id } });
  if (!owner || owner.userId !== req.identity.user.id || owner.customerId !== req.identity.user.stripeId) throw failure(403, 'Account access denied');
  next();
});
const subscriptionOwner = wrap(async (req, _res, next) => {
  const { subscription_id: id, payment_method: method } = req.body;
  if (typeof id !== 'string' || id.length > 255 || !/^sub_[A-Za-z0-9_]+$/.test(id) || typeof method !== 'string' || method.length > 255 || !/^pm_[A-Za-z0-9_]+$/.test(method)) throw failure(400, 'Invalid payment input');
  const sub = await db.subscription.findUnique({ where: { userId: req.identity.user.id } });
  if (!sub || sub.id !== id || sub.stripeId !== req.identity.user.stripeId) throw failure(403, 'Account access denied');
  next();
});
module.exports = { wrap, noStore, browserGuard, requireSession, requireAdmin, customerOwner, checkoutOwner, subscriptionOwner };
