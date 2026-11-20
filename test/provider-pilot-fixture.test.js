// The module-loader fixture requires its own isolated test process.
const assert = require('node:assert/strict');
const { test } = require('node:test');
const start = require('./support/provider-playback');

test('catalog pilot retains the primary ID independently of catalog number and never adds the synthetic track', async () => {
  const resolved = [];
  const pilot = await start({ port: 0,
    catalogTrack: { id: 7, trackId: 15, public: false, plays: 0 },
    delivery: {
      /** Records the exact primary ID accepted by the real authorization service. */
      async resolveAsset(trackId) {
        resolved.push(trackId);
        return { trackId, namespace: 'playback', key: 'playback/synthetic.mp3', contentType: 'audio/mpeg' };
      },

      /** Supplies only an inert capability for this offline fixture contract check. */
      async signPlayback() { return 'https://synthetic.example.invalid/temporary'; },
    },
  });
  try {
    const f = pilot.fixture;
    const path = 'track/7/playback-access/synthetic-public-key';
    assert.equal((await f.json(path, {})).status, 401);
    assert.deepEqual(resolved, []);
    const cookie = await f.login();
    const result = await f.json(path, {}, cookie);
    assert.equal(result.status, 200);
    assert.equal(result.body.trackId, 7);
    assert.deepEqual(resolved, [7]);
    assert.deepEqual(f.prisma.tables.track.map((track) => track.id), [7]);
    assert.equal((await f.json('track/15/playback-access/synthetic-public-key', {}, cookie)).status, 404);
    assert.equal((await f.json('track/10/playback-access/synthetic-public-key', {}, cookie)).status, 404);
  } finally { await pilot.close(); }
  await assert.rejects(start({ port: 0, catalogTrack: { id: 7, public: false, url: '' }, delivery: {} }), /without media locator/);
});
