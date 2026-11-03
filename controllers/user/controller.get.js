const { db } = require('../../identity/runtime');
const { publicUser } = require('../../identity/service');
const { wrap } = require('../../identity/http');
module.exports = {
  getAll: wrap(async (_req, res) => {
    const users = await db.user.findMany({});
    res.json({ user: users.map(publicUser) });
  }),
};
