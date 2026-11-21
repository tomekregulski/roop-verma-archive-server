const fs = require('node:fs');
const path = require('node:path');
const { randomUUID } = require('node:crypto');
const { readAssets } = require('../playback/assets');

/** Recreates the private manifest from durable release configuration before app startup. */
function materializePlaybackManifest(env = process.env) {
  const filename = env.PLAYBACK_ASSETS_FILE;
  const raw = env.PLAYBACK_ASSETS_JSON;
  if (!filename || !path.isAbsolute(filename) || typeof raw !== 'string' ||
      !raw.trim() || Buffer.byteLength(raw, 'utf8') > 65536)
    throw new Error('Invalid playback configuration');
  const directory = path.dirname(filename);
  fs.mkdirSync(directory, { recursive: true, mode: 0o700 });
  if (!fs.lstatSync(directory).isDirectory()) throw new Error('Invalid playback configuration');
  fs.chmodSync(directory, 0o700);
  const candidate = path.join(directory, `.assets-${randomUUID()}.candidate`);
  try {
    fs.writeFileSync(candidate, raw, { flag: 'wx', mode: 0o600 });
    if (!readAssets(candidate).size) throw new Error('Invalid playback configuration');
    fs.renameSync(candidate, filename);
  } finally {
    fs.rmSync(candidate, { force: true });
  }
}

/** Refuses to start the hosted app if release configuration cannot supply valid assets. */
function startHosted() {
  try {
    materializePlaybackManifest();
  } catch {
    process.stderr.write('Playback manifest configuration invalid\n');
    process.exitCode = 1;
    return;
  }
  delete process.env.PLAYBACK_ASSETS_JSON;
  require('../index');
}

if (require.main === module) startHosted();

module.exports = { materializePlaybackManifest };
