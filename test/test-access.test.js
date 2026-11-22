const assert = require('node:assert/strict');
const { after, before, beforeEach, test } = require('node:test');
const { webhooks } = require('stripe');
const { hash } = require('../identity/service');
const addCatalog = require('./support/catalog-db');
const createFixture = require('./support/identity-http');

const owner = 'admin@example.invalid';
const tester = 'tester@example.invalid';
const unexpected = 'b@example.invalid';
const signup = 'user/synthetic-public-key';
const track = 'track/20/playback-access/synthetic-public-key';
const registration = (email) => ({ email, firstName: 'Test', lastName: 'Listener' });
const contact = { name: 'Test Listener', email: tester, message: 'Synthetic request' };
let f;

before(async () => {
  f = await createFixture({
    configuration: { TEST_ACCESS_EMAILS: `${owner.toUpperCase()}, ${tester}` },
    playbackAdapters: () => ({
      readEntitlement: async () => null,
      resolveAsset: async () => assert.fail('denied requests must not resolve media'),
      signPlayback: async () => assert.fail('denied requests must not reach the signer'),
    }),
  });
  addCatalog(f.prisma, f.calls);
});
beforeEach(async () => {
  await f.reset();
  f.prisma.tables.track.push({ id: 20, public: false });
});
after(async () => { if (f) await f.close(); });

test('direct and browser-shaped signup and login cannot write an unapproved User or login proof', async () => {
  const originalUsers = structuredClone(f.prisma.tables.user);
  for (const [email, headers] of [
    [unexpected, {}],
    ['tester+other@example.invalid', { Origin: f.config.clientOrigin }],
  ]) {
    const registered = await f.json(signup, registration(email), undefined, headers);
    assert.equal(registered.status, 202);
    assert.deepEqual(registered.body, { accepted: true, testing: true });
    assert.equal(registered.headers.get('cache-control'), 'no-store');

    const login = await f.json('auth/login', { email }, undefined, headers);
    assert.equal(login.status, 202);
    assert.deepEqual(login.body, {
      message: 'If the account is eligible, a login link will be emailed.',
      testing: true,
    });
    assert.equal(login.cookie, undefined);
  }
  assert.deepEqual(f.prisma.tables.user, originalUsers);
  assert.deepEqual(f.prisma.tables.loginProof, []);
  assert.deepEqual(f.mail, []);
  assert.equal(f.calls.some((call) => /^(user|loginProof|stripe)\./.test(call)), false);
});

test('approved owner login and tester signup still use email proof and persisted roles', async () => {
  const registered = await f.json(signup, registration(tester.toUpperCase()));
  assert.deepEqual(registered.body, { accepted: true, testing: true });
  assert.equal(f.mail.length, 0);
  assert.equal(f.prisma.tables.user.at(-1).isAdmin, false);

  const testerCookie = await f.login(tester);
  assert.equal(f.mail.at(-1).to, tester);
  const ownerCookie = await f.login(owner);
  assert.equal(f.mail.at(-1).to, owner);
  assert.equal((await f.request(signup, { headers: { Cookie: testerCookie } })).status, 403);
  assert.equal((await f.request(signup, { headers: { Cookie: ownerCookie } })).status, 200);
  assert.equal((await f.json('support', contact, testerCookie)).status, 202);
  assert.equal(f.supportMail.length, 1);
  assert.equal((await f.json('auth/logout', {}, testerCookie)).status, 204);
  assert.equal((await f.json('support', contact, testerCookie)).status, 403);
  assert.equal(f.supportMail.length, 1);
});

test('an approved address in the support body is insufficient, including with a pre-existing unapproved session', async () => {
  const token = 's'.repeat(43);
  await f.prisma.identitySession.create({ data: {
    tokenHash: hash(token), userId: 2, email: unexpected,
    expiresAt: new Date(f.clock().getTime() + f.config.sessionMs),
  } });
  const existingCookie = `${f.config.cookieName}=${token}`;
  for (const cookie of [undefined, `${f.config.cookieName}=fake`, existingCookie]) {
    const response = await f.json('support', contact, cookie);
    assert.equal(response.status, 403);
    assert.equal(response.body.error.code, 'TEST_SUPPORT_RESTRICTED');
    assert.equal(response.headers.get('cache-control'), 'no-store');
  }
  const session = await f.request('auth/session', { headers: { Cookie: existingCookie } });
  assert.equal(session.status, 200);
  assert.equal(session.body.user.isAdmin, false);
  assert.equal((await f.request(signup, { headers: { Cookie: existingCookie } })).status, 403);
  assert.equal((await f.json(track, {}, existingCookie)).status, 403);
  assert.deepEqual(f.supportMail, []);
});

test('an outstanding login proof for an unapproved account cannot establish a session', async () => {
  const token = 'p'.repeat(43);
  await f.prisma.loginProof.create({ data: {
    tokenHash: hash(token), userId: 2, email: unexpected, delivered: true,
    expiresAt: new Date(f.clock().getTime() + f.config.proofMs),
  } });
  const result = await f.json('auth/verify', { token });
  assert.equal(result.status, 401);
  assert.equal(result.cookie, undefined);
  assert.equal(f.prisma.tables.loginProof[0].consumedAt, null);
  assert.deepEqual(f.prisma.tables.identitySession, []);
});

test('an enabled empty allowlist blocks account writes and both deliveries', async () => {
  const list = f.config.testAccessEmails;
  const entries = [...list];
  const cookie = await f.login(owner);
  const mailCount = f.mail.length;
  const proofCount = f.prisma.tables.loginProof.length;
  list.clear();
  try {
    assert.equal((await f.json(signup, registration(tester))).body.testing, true);
    assert.equal((await f.json('auth/login', { email: owner })).body.testing, true);
    assert.equal((await f.json('support', contact, cookie)).status, 403);
    assert.equal(f.prisma.tables.user.some((user) => user.email === tester), false);
    assert.equal(f.prisma.tables.loginProof.length, proofCount);
    assert.equal(f.mail.length, mailCount);
    assert.deepEqual(f.supportMail, []);
  } finally {
    for (const [key, email] of entries) list.set(key, email);
  }
});

test('TEST keeps CSRF checks, login and support limits, private playback and signed webhooks', async () => {
  const cookie = await f.login(owner);
  const wrongOrigin = { Origin: 'https://other.example.invalid' };
  assert.equal((await f.json(signup, registration(tester), undefined, wrongOrigin)).status, 403);
  assert.equal((await f.json('auth/login', { email: owner }, undefined, { 'X-RVDL-CSRF': '' })).status, 403);
  assert.equal((await f.json('support', contact, cookie, wrongOrigin)).status, 403);
  assert.equal((await f.json('support', contact, cookie, { 'X-RVDL-CSRF': '' })).status, 403);
  assert.deepEqual(f.supportMail, []);
  for (let attempt = 0; attempt < 5; attempt++) {
    assert.equal((await f.json('auth/login', { email: unexpected })).status, 202);
    assert.equal((await f.json('support', contact, cookie)).status, 202);
  }
  assert.equal((await f.json('auth/login', { email: unexpected })).status, 429);
  assert.equal((await f.json('support', contact, cookie)).status, 429);
  assert.equal(f.mail.length, 1);
  assert.equal(f.supportMail.length, 5);
  assert.equal((await f.json(track, {})).status, 401);
  assert.equal((await f.json(track, {}, cookie)).status, 403);

  const body = JSON.stringify({ id: 'evt_test_access', type: 'customer.created', data: { object: {} } }, null, 2);
  const signature = webhooks.generateTestHeaderString({ payload: body, secret: 'whsec_synthetic_fixture_only' });
  const post = (headers) => f.request('payment/webhooks', {
    method: 'POST', body, headers: { 'Content-Type': 'application/json', ...headers },
  });
  assert.equal((await post({})).status, 400);
  assert.equal((await post({ 'Stripe-Signature': signature })).status, 200);
});
