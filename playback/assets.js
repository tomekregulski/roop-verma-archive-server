const { readFileSync, statSync } = require('node:fs');
const { isAbsolute } = require('node:path');

const KEY = /^playback\/[a-f0-9]{64}\.mp3$/;

/** Loads an operator-owned manifest once; request input can never choose a locator. */
function readAssets(filename) {
  if (!filename || !isAbsolute(filename) || statSync(filename).size > 65536)
    throw new Error('Invalid playback configuration');
  const rows = JSON.parse(readFileSync(filename, 'utf8'));
  if (!Array.isArray(rows)) throw new Error('Invalid playback configuration');
  const assets = new Map();
  const keys = new Set();
  for (const row of rows) {
    if (!row || Object.keys(row).sort().join(',') !== 'key,trackId' ||
        !Number.isInteger(row.trackId) || row.trackId < 1 || row.trackId > 2147483647 ||
        typeof row.key !== 'string' || !KEY.test(row.key) ||
        assets.has(row.trackId) || keys.has(row.key))
      throw new Error('Invalid playback configuration');
    assets.set(row.trackId, Object.freeze({
      trackId: row.trackId, namespace: 'playback', key: row.key, contentType: 'audio/mpeg',
    }));
    keys.add(row.key);
  }
  return assets;
}

module.exports = { readAssets, KEY };
