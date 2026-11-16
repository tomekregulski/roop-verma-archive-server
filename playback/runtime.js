const { db, identity } = require('../identity/runtime');
const { createPlayback } = require('./service');

let delivery;
/** Loads explicit delivery configuration only when authorized playback needs it. */
function getDelivery() {
  if (!delivery) delivery = require('./r2').createR2Delivery(process.env);
  return delivery;
}

module.exports = createPlayback({
  db,
  identity,
  readEntitlement: require('../billing/runtime').readEntitlement,
  resolveAsset: (trackId) => getDelivery().resolveAsset(trackId),
  signPlayback: (input) => getDelivery().signPlayback(input),
});
