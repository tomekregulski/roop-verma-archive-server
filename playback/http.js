const issue = require('./runtime');
const { config } = require('../identity/runtime');
const { failure } = require('../identity/service');
const { wrap } = require('../identity/http');

/**
 * Handles playback-access requests and returns successful issuance as JSON.
 * The shared wrap helper forwards thrown validation errors and rejected issue()
 * promises to Express error middleware, which produces the HTTP error response.
 */
module.exports = wrap(async (req, res) => {
  // Exactly one authority selector: the server's Track primary ID in the path.
  if (!req.is('application/json') || !/^[1-9][0-9]*$/.test(req.params.trackId) ||
    !Number.isSafeInteger(Number(req.params.trackId)) || Number(req.params.trackId) > 2147483647 ||
    Object.keys(req.query).length || !req.body || Array.isArray(req.body) ||
    typeof req.body !== 'object' || Object.keys(req.body).length) {
    throw failure(400, 'Expected a track ID and empty JSON object');
  }
  res.json(await issue({ trackId: Number(req.params.trackId), credential: req.cookies?.[config.cookieName] }));
});
