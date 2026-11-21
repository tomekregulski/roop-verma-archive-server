const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { materializePlaybackManifest } = require('../scripts/start-hosted');
const { readAssets } = require('../playback/assets');

/** Gives each startup check a fresh private filesystem, independent of operator files. */
function withDirectory(check) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'rvdl-hosted-startup-'));
  try { check(directory); }
  finally { fs.rmSync(directory, { recursive: true, force: true }); }
}

/** Creates a synthetic manifest; never reads retained provider configuration. */
function configuration(directory, digest = 'a') {
  return {
    PLAYBACK_ASSETS_FILE: path.join(directory, '.playback', 'assets.json'),
    PLAYBACK_ASSETS_JSON: JSON.stringify([{ trackId: 7, key: `playback/${digest.repeat(64)}.mp3` }]),
  };
}

test('hosted startup creates a private validated file consumed by the existing reader', () => {
  withDirectory((directory) => {
    const env = configuration(directory);
    materializePlaybackManifest(env);
    assert.deepEqual([...readAssets(env.PLAYBACK_ASSETS_FILE).keys()], [7]);
    assert.equal(fs.statSync(path.dirname(env.PLAYBACK_ASSETS_FILE)).mode & 0o777, 0o700);
    assert.equal(fs.statSync(env.PLAYBACK_ASSETS_FILE).mode & 0o777, 0o600);
    assert.deepEqual(fs.readdirSync(path.dirname(env.PLAYBACK_ASSETS_FILE)), ['assets.json']);
  });
});

test('every hosted restart atomically replaces the manifest from current release input', () => {
  withDirectory((directory) => {
    const env = configuration(directory);
    materializePlaybackManifest(env);
    const old = fs.readFileSync(env.PLAYBACK_ASSETS_FILE, 'utf8');
    materializePlaybackManifest(configuration(directory, 'b'));
    assert.notEqual(fs.readFileSync(env.PLAYBACK_ASSETS_FILE, 'utf8'), old);
    assert.equal(fs.statSync(env.PLAYBACK_ASSETS_FILE).mode & 0o777, 0o600);
  });
});

test('invalid and empty manifests refuse startup while preserving the last valid file', () => {
  withDirectory((directory) => {
    const env = configuration(directory);
    materializePlaybackManifest(env);
    const valid = fs.readFileSync(env.PLAYBACK_ASSETS_FILE, 'utf8');
    for (const raw of ['{', '[]', '[{"trackId":7,"key":"https://example.invalid/a.mp3"}]',
      JSON.stringify([{ trackId: 7, key: `playback/${'a'.repeat(64)}.mp3`, extra: true }])]) {
      assert.throws(() => materializePlaybackManifest({ ...env, PLAYBACK_ASSETS_JSON: raw }));
      assert.equal(fs.readFileSync(env.PLAYBACK_ASSETS_FILE, 'utf8'), valid);
      assert.deepEqual(fs.readdirSync(path.dirname(env.PLAYBACK_ASSETS_FILE)), ['assets.json']);
    }
  });
});

test('missing input, relative destinations and oversized input fail before creating files', () => {
  withDirectory((directory) => {
    const env = configuration(directory);
    for (const override of [{ PLAYBACK_ASSETS_JSON: undefined }, { PLAYBACK_ASSETS_JSON: '' },
      { PLAYBACK_ASSETS_FILE: undefined }, { PLAYBACK_ASSETS_FILE: 'relative.json' },
      { PLAYBACK_ASSETS_JSON: ' '.repeat(65537) }])
      assert.throws(() => materializePlaybackManifest({ ...env, ...override }));
    assert.deepEqual(fs.readdirSync(directory), []);
  });
});

test('hosted command fails without booting the app or exposing manifest contents', () => {
  withDirectory((directory) => {
    const env = { ...process.env, ...configuration(directory), PLAYBACK_ASSETS_JSON: 'private-invalid-content' };
    const result = spawnSync(process.execPath, [path.join(__dirname, '../scripts/start-hosted.js')], {
      env, encoding: 'utf8', timeout: 5000,
    });
    assert.equal(result.status, 1);
    assert.equal(result.stdout, '');
    assert.equal(result.stderr, 'Playback manifest configuration invalid\n');
  });
});
