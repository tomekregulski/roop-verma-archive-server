const { publicUser } = require('../../identity/service');
module.exports = {
  session: (req, res) => res.json({ user: publicUser(req.identity.user), expiresAt: req.identity.session.expiresAt }),
  retired: (_req, res) => res.status(410).json({ error: { message: 'Use the email login API' } }),
};
