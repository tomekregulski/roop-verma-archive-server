const assert = require('node:assert/strict');
const { test, before, after, beforeEach } = require('node:test');
const { mkdtempSync, writeFileSync, rmSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { join } = require('node:path');
const { createHmac, createHash } = require('node:crypto');
const { readAssets } = require('../playback/assets');
const { createR2Delivery } = require('../playback/r2');
const createFixture = require('./support/identity-http');
const addCatalog = require('./support/catalog-db');
const directory = mkdtempSync(join(tmpdir(), 'rvdl-playback-manifest-'));
const filename = join(directory, 'assets.json');
const key = `playback/${'a'.repeat(64)}.mp3`;
const time = new Date('2026-10-17T16:00:00Z');
const env = {
  PLAYBACK_ASSETS_FILE: filename,
  PLAYBACK_R2_ACCOUNT_ID: 'a'.repeat(32),
  PLAYBACK_R2_BUCKET: 'synthetic-playback-only',
  PLAYBACK_R2_ACCESS_KEY_ID: 'synthetic-key',
  PLAYBACK_R2_SECRET_ACCESS_KEY: 'synthetic-secret',
};
let fixture, metadata, missing, duringHead, signatures, evidence;
const client = { async send(command, options) {
  assert.equal(command.constructor.name, 'HeadObjectCommand');
  assert.equal(command.input.Bucket, env.PLAYBACK_R2_BUCKET);
  assert.ok([key, `playback/${'b'.repeat(64)}.mp3`].includes(command.input.Key));
  assert.ok(options.abortSignal);
  await duringHead?.();
  if (missing) throw Error('synthetic object missing');
  return metadata;
} };

before(async () => {
  writeFileSync(filename, JSON.stringify([{ trackId: 10, key }, { trackId: 20, key: `playback/${'b'.repeat(64)}.mp3` }]));
  fixture = await createFixture({ playbackAdapters: ({ now }) => {
    const delivery = createR2Delivery(env, { client, now, presign: async () => {
      signatures++;
      return 'https://synthetic.example.invalid/temporary';
    } });
    return { ...delivery, readEntitlement: async () => evidence };
  } });
  addCatalog(fixture.prisma, fixture.calls);
});
after(async () => {
  await fixture?.close();
  rmSync(directory, { recursive: true, force: true });
});
beforeEach(async () => {
  await fixture.reset();
  fixture.prisma.tables.track.push({ id: 10, public: true }, { id: 20, public: false });
  metadata = { ContentType: 'audio/mpeg', ContentLength: 100 };
  missing = false; duringHead = undefined; signatures = 0; evidence = null;
});

test('manifest is explicit, content-addressed, strict and independent of Track.url', () => {
  assert.equal(readAssets(filename).get(10).key, key);
  const bad = join(directory, 'bad.json');
  for (const rows of [{}, [null], [{ trackId: 0, key }], [{ trackId: 1, key, bucket: 'archive' }],
    [{ trackId: 1, key: 'https://legacy.invalid/a.mp3' }], [{ trackId: 1, key: 'playback/../a.mp3' }],
    [{ trackId: 1, key: 'archive/a.wav' }], [{ trackId: 1, key }, { trackId: 1, key }],
    [{ trackId: 1, key }, { trackId: 2, key }]]) {
    writeFileSync(bad, JSON.stringify(rows));
    assert.throws(() => readAssets(bad), /Invalid playback configuration/);
  }
  assert.throws(() => readAssets('relative.json'));
  assert.throws(() => readAssets(join(directory, 'missing.json')));
});

test('SDK signs a real offline SigV4 GET bound to one object, fixed bucket and two hours', async () => {
  const delivery = createR2Delivery(env, { now: () => time });
  const asset = { namespace: 'playback', key, contentType: 'audio/mpeg' };
  const url = new URL(await delivery.signPlayback({ asset, expiresAt: new Date(+time + 7200000) }));
  assert.equal(url.origin, `https://${env.PLAYBACK_R2_ACCOUNT_ID}.r2.cloudflarestorage.com`);
  assert.equal(url.pathname, `/${env.PLAYBACK_R2_BUCKET}/${key}`);
  assert.equal(url.searchParams.get('X-Amz-Expires'), '7200');
  assert.equal(url.searchParams.get('X-Amz-SignedHeaders'), 'host');
  // Independent verifier ensures GET, path and expiry participate in the signature.
  const hash = (value) => createHash('sha256').update(value).digest('hex');
  const mac = (secret, value) => createHmac('sha256', secret).update(value).digest();
  const encode = (value) => encodeURIComponent(value).replace(/[!'()*]/g, (char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`);
  const signature = url.searchParams.get('X-Amz-Signature');
  url.searchParams.delete('X-Amz-Signature');
  const query = [...url.searchParams].map(([k, v]) => [encode(k), encode(v)])
    .sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0).map((row) => row.join('=')).join('&');
  const scope = url.searchParams.get('X-Amz-Credential').split('/').slice(1).join('/');
  const signingKey = mac(mac(mac(mac(`AWS4${env.PLAYBACK_R2_SECRET_ACCESS_KEY}`, '20261017'), 'auto'), 's3'), 'aws4_request');
  const verify = (method, path) => mac(signingKey, `AWS4-HMAC-SHA256\n${url.searchParams.get('X-Amz-Date')}\n${scope}\n${hash(`${method}\n${path}\n${query}\nhost:${url.host}\n\nhost\nUNSIGNED-PAYLOAD`)}`).toString('hex');
  assert.equal(signature, verify('GET', url.pathname));
  assert.notEqual(signature, verify('PUT', url.pathname));
  assert.notEqual(signature, verify('GET', `${url.pathname}wrong`));
  for (const other of [{ ...asset, key: `playback/${'c'.repeat(64)}.mp3` },
    { ...asset, bucket: 'archive' }, { ...asset, namespace: 'archive' }, { ...asset, contentType: 'audio/wav' }])
    await assert.rejects(delivery.signPlayback({ asset: other, expiresAt: new Date(+time + 7200000) }));
  await assert.rejects(delivery.signPlayback({ asset, expiresAt: new Date(+time + 7201000) }));
  assert.throws(() => createR2Delivery({ ...env, PLAYBACK_R2_ACCOUNT_ID: 'attacker.invalid' }));
});

test('public mapping works; missing mapping/object, bad metadata and provider errors never sign', async () => {
  const request = () => fixture.json('track/10/playback-access/synthetic-public-key', {});
  assert.equal((await request()).status, 200);
  for (const value of [{ ContentType: 'audio/wav', ContentLength: 10 },
    { ContentType: 'audio/mpeg', ContentLength: 0 },
    { ContentType: 'audio/mpeg', ContentLength: 10, ContentEncoding: 'gzip' }]) {
    metadata = value; signatures = 0;
    assert.equal((await request()).status, 503); assert.equal(signatures, 0);
  }
  missing = true;
  assert.equal((await request()).status, 503); assert.equal(signatures, 0);
  assert.equal(await createR2Delivery(env, { client }).resolveAsset(999), null);
});

test('protected anonymous/unsubscribed/cross-account requests cannot reach storage or signing', async () => {
  const request = (cookie) => fixture.json('track/20/playback-access/synthetic-public-key', {}, cookie);
  duringHead = () => { throw Error('Storage must not be read on denial'); };
  assert.equal((await request()).status, 401);
  assert.equal((await request(await fixture.login())).status, 403);
  assert.equal((await request(await fixture.login('b@example.invalid'))).status, 403);
  assert.equal(signatures, 0);
});

for (const status of ['active', 'past_due']) {
  test(`authorized ${status} subscriber renews through mapping and signing; foreign account denies`, async () => {
    evidence = { kind: 'subscription', userId: 1, status, checkedAt: time, freshUntil: new Date(+time + 900000) };
    const cookie = await fixture.login();
    const request = (credential) => fixture.json('track/20/playback-access/synthetic-public-key', {}, credential);
    assert.equal((await request(cookie)).status, 200);
    assert.equal((await request(cookie)).status, 200);
    assert.equal((await request(await fixture.login('b@example.invalid'))).status, 403);
    assert.equal(signatures, 2);
  });
}
for (const change of ['logout', 'cancellation', 'revocation']) {
  test(`${change} during asynchronous object check wins before renewed signing`, async () => {
    evidence = { kind: 'subscription', userId: 1, status: 'active', checkedAt: time, freshUntil: new Date(+time + 900000) };
    const cookie = await fixture.login();
    const request = () => fixture.json('track/20/playback-access/synthetic-public-key', {}, cookie);
    assert.equal((await request()).status, 200);
    signatures = 0;
    duringHead = async () => {
      if (change === 'logout') await fixture.json('auth/logout', {}, cookie);
      else if (change === 'cancellation') evidence = null;
      else fixture.advance(7 * 86400000);
    };
    assert.equal((await request()).status, change === 'cancellation' ? 403 : 401);
    assert.equal(signatures, 0);
  });
}
