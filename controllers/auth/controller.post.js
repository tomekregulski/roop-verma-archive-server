const { config, identity } = require('../../identity/runtime');
const { emailAddress, failure } = require('../../identity/service');
const { wrap } = require('../../identity/http');
function exactBody(req, key) {
  if (!req.is('application/json') || !req.body || Array.isArray(req.body) ||
      Object.keys(req.body).length !== 1 || !Object.hasOwn(req.body, key)) throw failure(400, 'Invalid request body');
  return req.body[key];
}
module.exports = {
  login: wrap(async (req, res) => {
    await identity.requestLogin(emailAddress(exactBody(req, 'email')), req.ip);
    res.status(202).json({ message: 'If the account is eligible, a login link will be emailed.' });
  }),
  verify: wrap(async (req, res) => {
    const result = await identity.verify(exactBody(req, 'token'), req.ip, req.cookies && req.cookies[config.cookieName]);
    res.cookie(config.cookieName, result.rawSession, { ...config.cookie, maxAge: config.sessionMs });
    res.json({ user: result.user, expiresAt: result.expiresAt });
  }),
  logout: wrap(async (req, res) => {
    await identity.logout(req.cookies && req.cookies[config.cookieName]);
    res.clearCookie(config.cookieName, config.cookie);
    res.status(204).end();
  }),
};
