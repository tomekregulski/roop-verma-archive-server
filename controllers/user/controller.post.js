const { purchase } = require('../../billing/runtime');
const { failure } = require('../../identity/service');
const { wrap } = require('../../identity/http');
module.exports = {
  newUser: wrap(async (req, res) => res.status(202).json(await purchase.register(req.body))),
  createPortalSession: wrap(async (req, res) => {
    if (Object.keys(req.body).length) throw failure(400, 'Unexpected purchase input');
    res.json(await purchase.portal(req.identity.user.id));
  }),
};
