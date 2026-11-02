const { db, identity } = require('../identity/runtime');
const { createPlayback } = require('./service');

// Entitlement uses durable billing evidence. Delivery integration remains incomplete. No env flag, test grant,
// legacy URL fallback or fake signer is available to the deployed application.
const unavailable = async () => {
  throw new Error('Playback integration incomplete');
};
module.exports = createPlayback({
  db,
  identity,
  readEntitlement: require('../billing/runtime').readEntitlement,
  resolveAsset: unavailable,
  signPlayback: unavailable,
});
