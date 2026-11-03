const assert = require('node:assert/strict');
const { test, before, after } = require('node:test');
const createFixture = require('./support/identity-http');
const addCatalog = require('./support/catalog-db');
let f;
before(async () => {
  // No playback injection: load the actual production composition, replacing
  // only identity/storage as in the existing HTTP harness.
  f = await createFixture(); addCatalog(f.prisma, f.calls);
  f.prisma.tables.track.push({ id: 1, public: true, url: 'https://legacy.example.invalid/public.mp3' }, { id: 2, public: false });
});
after(async () => { if (f) await f.close(); });
test('normal runtime never issues fake or legacy URLs, even for public tracks and active admins', async () => {
  const publicResult = await f.json('track/1/playback-access/synthetic-public-key', {});
  assert.equal(publicResult.status, 503); assert.equal(publicResult.body.url, undefined);
  const cookie = await f.login('admin@example.invalid');
  f.prisma.tables.user[2].subscriptionActive = 'active';
  const result = await f.json('track/2/playback-access/synthetic-public-key', {}, cookie);
  assert.equal(result.status, 403); assert.equal(result.body.url, undefined);
  assert.equal(f.calls.includes('subscription.findUnique'), false, 'legacy billing fields must not be used as paid proof');
});
