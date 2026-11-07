// Approximate starts only: no account linkage, duration, history or playback grant.
const { db, identity } = require('../identity/runtime');
const { wrap } = require('../identity/http');
const { failure } = require('../identity/service');

module.exports = wrap(async (req, res) => {
  if (
    !req.is('application/json') ||
    !/^[1-9][0-9]*$/.test(req.params.trackId) ||
    !Number.isSafeInteger(Number(req.params.trackId)) ||
    Number(req.params.trackId) > 2147483647 ||
    Object.keys(req.query).length ||
    !req.body ||
    Array.isArray(req.body) ||
    typeof req.body !== 'object' ||
    Object.keys(req.body).length
  )
    throw failure(400, 'Expected a track ID and empty JSON object');
  // Reuse the existing keyed, expiring rate limiter. No listener identifiers are stored.
  await identity.limit('listen-ip', req.ip, 120, 15 * 60 * 1000);
  const changed = await db.$executeRaw`
    UPDATE "Track" SET plays = COALESCE(plays, 0) + 1 WHERE id = ${Number(
      req.params.trackId
    )}`;
  if (!changed) throw failure(404, 'Track not found');
  res.status(204).end();
});
