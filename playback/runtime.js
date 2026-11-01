const { db, identity } = require('../identity/runtime');
const { createPlayback } = require('./service');

// Deliberately incomplete production integrations. No env flag, test grant,
// legacy URL fallback or fake signer is available to the deployed application.
const unavailable = async () => { throw new Error('Playback integration incomplete'); };
module.exports = createPlayback({ db, identity,
  readEntitlement: unavailable, resolveAsset: unavailable, signPlayback: unavailable,
});
