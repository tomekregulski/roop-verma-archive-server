const assert = require('node:assert/strict');
const { test, before, after, beforeEach } = require('node:test');
const createFixture = require('./support/identity-http');
const addCatalog = require('./support/catalog-db');
let f, entitlement, asset, failEntitlement, failSigner, signatures, lookups, mappingDelay;
const start = Date.parse('2026-10-17T16:00:00Z');
const paid = (extra = {}) => ({ kind: 'paid', userId: 1, paidFrom: new Date(start - 86400000), paidThrough: new Date(start + 86400000), ...extra });
before(async () => {
  f = await createFixture({ playbackAdapters: ({ calls }) => ({
    readEntitlement: async userId => { calls.push('entitlement.read'); lookups.push(userId); if (failEntitlement) throw Error('unavailable'); return entitlement; },
    resolveAsset: async trackId => { calls.push('asset.resolve'); f.advance(mappingDelay); return asset === undefined ? { trackId, namespace: 'playback', key: `playback/track-${trackId}.mp3`, contentType: 'audio/mpeg' } : asset; },
    signPlayback: async input => { calls.push('playback.sign'); signatures.push(input); if (failSigner) throw Error('unavailable'); return 'https://synthetic.example.invalid/temporary.mp3?fake=1'; },
  }) });
  addCatalog(f.prisma, f.calls);
});
after(async () => { if (f) await f.close(); });
beforeEach(async () => {
  await f.reset(); entitlement = null; asset = undefined; failEntitlement = false; failSigner = false; signatures = []; lookups = []; mappingDelay = 0;
  f.prisma.tables.track.push({ id: 10, trackId: 100, public: true, url: 'https://legacy.example.invalid/public.mp3', master: true },
    { id: 20, trackId: 200, public: false, url: 'https://legacy.example.invalid/subscriber.mp3', master: false });
});
const request = (id = 20, cookie, body = {}, extraHeaders = {}, suffix = '') => f.json(`track/${id}/playback-access/synthetic-public-key${suffix}`, body, cookie, extraHeaders);
async function deny(status, cookie, options = {}) {
  signatures.length = 0; f.calls.length = 0;
  const before = structuredClone(f.prisma.tables);
  const result = await request(options.id ?? 20, cookie, options.body ?? {}, options.headers, options.suffix);
  assert.equal(result.status, status);
  assert.equal(result.headers.get('cache-control'), 'no-store');
  assert.equal(signatures.length, 0, 'denials must never invoke the signer');
  assert.deepEqual(f.prisma.tables, before, 'issuance must never mutate storage');
  assert.equal(JSON.stringify(result.body).includes('legacy.example'), false);
  return result;
}

test('anonymous public track signs exactly its mapped MP3 for two hours without entitlement reads', async () => {
  const result = await request(10);
  assert.equal(result.status, 200);
  assert.deepEqual(result.body, { trackId: 10, url: 'https://synthetic.example.invalid/temporary.mp3?fake=1', expiresAt: new Date(start + 7200000).toISOString() });
  assert.equal(result.headers.get('cache-control'), 'no-store');
  assert.deepEqual(signatures, [{ asset: { namespace: 'playback', key: 'playback/track-10.mp3', contentType: 'audio/mpeg' }, expiresAt: new Date(start + 7200000) }]);
  assert.deepEqual(lookups, []);
});
test('subscriber access rejects absent, malformed, unknown, expired and revoked sessions', async () => {
  await deny(401);
  await deny(401, `${f.config.cookieName}=malformed`);
  await deny(401, `${f.config.cookieName}=${'x'.repeat(43)}`);
  const cookie = await f.login(); entitlement = paid();
  f.advance(7 * 86400000); await deny(401, cookie);
  f.advance(-7 * 86400000); await f.json('auth/logout', {}, cookie); await deny(401, cookie);
  assert.deepEqual(lookups, []);
});
test('deleted users, changed email and unavailable session storage fail closed', async () => {
  const cookie = await f.login(); entitlement = paid();
  f.user.email = 'changed@example.invalid'; await deny(401, cookie); f.user.email = 'a@example.invalid';
  const find = f.prisma.identitySession.findUnique;
  f.prisma.identitySession.findUnique = async () => { throw Error('unavailable'); };
  await deny(500, cookie); f.prisma.identitySession.findUnique = find;
  await f.prisma.user.delete({ where: { id: 1 } }); await deny(401, cookie);
});
test('valid session plus normalized synthetic paid interval signs only the requested track', async () => {
  const cookie = await f.login(); entitlement = paid();
  const result = await request(20, cookie);
  assert.equal(result.status, 200); assert.equal(result.body.trackId, 20);
  assert.deepEqual(lookups, [1, 1]);
  assert.equal(signatures[0].asset.key, 'playback/track-20.mp3');
  assert.equal(signatures[0].expiresAt.getTime(), start + 7200000);
});
test('cancelled paid interval grants before end and rejects exactly at and after end', async () => {
  const cookie = await f.login(); entitlement = paid({ cancelled: true });
  f.advance(86400000 - 1); assert.equal((await request(20, cookie)).status, 200);
  f.advance(1); await deny(403, cookie);
  f.advance(1); await deny(403, cookie);
});
for (const kind of ['incomplete', 'unpaid', 'active', 'trialing', 'past_due', 'paused', 'canceled', 'revoked', 'unknown']) {
  test(`raw/unapproved entitlement kind ${kind} cannot grant`, async () => {
    const cookie = await f.login(); entitlement = paid({ kind }); await deny(403, cookie);
  });
}
test('missing, ambiguous, future, expired, malformed and foreign-user entitlements deny', async () => {
  const cookie = await f.login();
  for (const value of [null, undefined, [paid(), paid()], {}, paid({ userId: 2 }), paid({ paidFrom: new Date(start + 1) }),
    paid({ paidThrough: new Date(start) }), paid({ paidThrough: new Date(NaN) }), paid({ paidThrough: '2099-01-01' }),
    paid({ status: 'incomplete' }), paid({ revokedAt: new Date(start) }), paid({ cancelled: 'yes' }),
    paid({ paidFrom: new Date(start + 20), paidThrough: new Date(start + 10) })]) {
    entitlement = value; await deny(403, cookie);
  }
  failEntitlement = true; await deny(503, cookie);
});
test('paid period ending while asset mapping is pending cannot reach the signer', async () => {
  const cookie = await f.login(); entitlement = paid({ paidThrough: new Date(start + 1) }); mappingDelay = 1;
  await deny(403, cookie);
});
test('legacy subscriptionActive and admin flags confer no playback rights', async () => {
  const cookie = await f.login('admin@example.invalid');
  f.prisma.tables.user[2].subscriptionActive = 'active';
  await deny(403, cookie); assert.deepEqual(lookups, [3]);
});
test('body/query asset, track, identity and entitlement substitutions reject before lookup', async () => {
  const cookie = await f.login(); entitlement = paid();
  for (const body of [{ trackId: 10 }, { url: 'https://attacker.invalid/file.mp3' }, { asset: { key: 'archive/original.wav' } },
    { subscriptionActive: 'active' }, { entitlement: paid() }, { isAdmin: true, userId: 3 }, []]) {
    await deny(400, cookie, { body }); assert.deepEqual(f.calls, []);
  }
  await deny(400, cookie, { suffix: '?trackId=10&public=true&isAdmin=true' });
  entitlement = null;
  await deny(403, cookie, { headers: { 'X-Admin': 'true', 'X-Subscription-Status': 'active', jwt: '{"isAdmin":true}', Authorization: 'Bearer fake' } });
  await deny(401, undefined, { headers: { 'X-User-Id': '1', 'X-Subscription-Status': 'active' } });
  await deny(404, cookie, { id: 999 });
});
test('identifiers, origin, CSRF and compatibility key are enforced without signing', async () => {
  for (const id of ['0', '-1', '1.5', '1e1', '2147483648', '9007199254740992']) await deny(400, undefined, { id });
  await deny(403, undefined, { id: 10, headers: { 'X-RVDL-CSRF': '' } });
  await deny(403, undefined, { id: 10, headers: { Origin: 'https://evil.example.invalid' } });
  assert.equal((await f.json('track/10/playback-access/wrong', {})).status, 403);
  assert.equal(signatures.length, 0);
});
test('public access remains available with stale or invalid cookies, without authenticating them', async () => {
  f.calls.length = 0;
  for (const cookie of [`${f.config.cookieName}=bad`, `${f.config.cookieName}=${'x'.repeat(43)}`]) {
    assert.equal((await request(10, cookie)).status, 200);
  }
  assert.equal(f.calls.includes('identitySession.findUnique'), false);
  assert.deepEqual(lookups, []);
});
test('denials never resolve assets; unavailable entitlements do not become anonymous access', async () => {
  await deny(401); assert.equal(f.calls.includes('asset.resolve'), false);
  const cookie = await f.login(); failEntitlement = true; await deny(503, cookie);
  assert.equal(f.calls.includes('asset.resolve'), false);
});
test('signing boundary cannot select archive WAVs, arbitrary buckets, URLs or another track', async () => {
  const valid = { trackId: 10, namespace: 'playback', contentType: 'audio/mpeg', key: 'playback/track-10.mp3' };
  for (const value of [null, { ...valid, trackId: 20 }, { ...valid, namespace: 'archive' },
    { ...valid, contentType: 'audio/wav' }, ...['archive/original.wav', 'playback/original.wav', 'https://host.invalid/a.mp3',
      'playback/../archive.wav', 'playback/%2e%2e.mp3', 'playback/a.mp3?key=archive', '/playback/a.mp3'].map(key => ({ ...valid, key }))]) {
    asset = value; await deny(503, undefined, { id: 10 });
  }
});
test('signer failure produces no successful URL response', async () => {
  failSigner = true; const result = await request(10); assert.equal(result.status, 503); assert.equal(result.body.url, undefined);
});
test('unknown or unavailable track visibility fails before signing', async () => {
  f.prisma.tables.track[0].public = null; await deny(503, undefined, { id: 10 });
  f.prisma.track.findUnique = async () => { throw Error('unavailable'); }; await deny(500, undefined, { id: 10 });
  // Restore the synthetic delegate for later tests.
  addCatalog(f.prisma, f.calls);
});

test('catalog projections remove permanent URLs/storage fields across reads, nested records and mutations', async () => {
  const secret = { url: 'https://legacy.example.invalid/secret.mp3', master: true, bucket: 'archive', objectKey: 'original.wav', playbackAsset: { key: 'private' } };
  const nested = { id: 50, public: false, ...secret, tape: { id: 1, tracks: [{ id: 51, ...secret }] } };
  f.prisma.tables.track.push(nested);
  for (const model of ['artist', 'category', 'location', 'mediaType', 'event', 'tape', 'raga']) {
    f.prisma.tables[model].push({ id: 1, name: 'Synthetic', ...secret, tracks: [nested], primaryTracks: [nested], tapes: [{ id: 1, tracks: [nested] }], events: [{ id: 1, tapes: [{ id: 1, tracks: [nested] }] }] });
  }
  function clean(body) {
    const json = JSON.stringify(body);
    for (const value of ['legacy.example', '"url"', '"master"', '"bucket"', '"objectKey"', '"playbackAsset"']) assert.equal(json.includes(value), false, value);
  }
  for (const path of ['track', 'track/public', 'TRACK', 'TRACK/PUBLIC', 'artist', 'category', 'location', 'media-type', 'event', 'tape', 'raga']) {
    const result = await f.request(`${path}/synthetic-public-key`); assert.equal(result.status, 200); clean(result.body);
    assert.equal(result.headers.get('cache-control'), 'no-store');
    if (path === 'track/public') assert.equal(result.body.every(track => track.public === true), true);
  }
  const cookie = await f.login('admin@example.invalid');
  const created = await f.json('track/synthetic-public-key', { trackId: 999, public: false, ...secret }, cookie);
  assert.equal(created.status, 200); clean(created.body);
  for (const method of ['PUT', 'DELETE']) {
    const result = await f.request('track/synthetic-public-key', { method, headers: { Cookie: cookie, 'X-RVDL-CSRF': '1', 'Content-Type': 'application/json' }, body: JSON.stringify({ id: created.body.data.id, ...secret }) });
    assert.equal(result.status, 200); clean(result.body);
  }
  const raga = await f.request('raga/synthetic-public-key', { method: 'PUT', headers: { Cookie: cookie, 'X-RVDL-CSRF': '1', 'Content-Type': 'application/json' }, body: JSON.stringify({ id: 1, tracks: [nested] }) });
  assert.equal(raga.status, 200); clean(raga.body);
});
