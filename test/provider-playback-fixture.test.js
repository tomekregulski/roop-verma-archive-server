const assert = require('node:assert/strict');
const { test, before, after } = require('node:test');
const start = require('./support/provider-playback');
let fixture;
before(async () => {
  fixture = await start({ port: 0, delivery: {
    resolveAsset: async (trackId) => ({ trackId, namespace: 'playback', key: 'playback/synthetic.mp3', contentType: 'audio/mpeg' }),
    signPlayback: async () => 'https://synthetic.example.invalid/temporary',
  } });
});
after(async () => fixture?.close());
test('provider fixture uses real HTTP identity/status authorization with explicit test-only media', async () => {
  const f = fixture.fixture;
  const path = 'track/10/playback-access/synthetic-public-key';
  assert.equal((await f.json(path, {})).status, 401);
  assert.equal((await f.json(path, {}, await f.login('b@example.invalid'))).status, 403);
  assert.equal((await f.json(path, {}, await f.login('admin@example.invalid'))).status, 403);
  const cookie = await f.login();
  const result = await f.json(path, {}, cookie);
  assert.equal(result.status, 200);
  const remaining = Date.parse(result.body.expiresAt) - Date.now();
  assert.ok(remaining > 7190000 && remaining <= 7200000);
  assert.equal(f.calls.some((call) => call.startsWith('stripe.invoices.')), false);
  await fixture.cancel();
  assert.equal((await f.json(path, {}, cookie)).status, 403);
});
test('provider fixture rejects absent delivery and cannot silently choose live providers', async () => {
  await assert.rejects(start({ port: 0 }), /Explicit non-production/);
});
