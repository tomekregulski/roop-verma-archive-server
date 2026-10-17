const { db } = require('../../identity/runtime');
const { failure } = require('../../identity/service');
const { wrap } = require('../../identity/http');
module.exports = {
  deleteById: wrap(async (req, res) => {
    const value = req.query.id;
    if (typeof value !== 'string' || !/^[1-9][0-9]*$/.test(value) || !Number.isSafeInteger(Number(value))) throw failure(400, 'Invalid user ID');
    await db.user.delete({ where: { id: Number(value) } });
    res.status(204).end();
  }),
};
