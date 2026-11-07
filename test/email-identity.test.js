const assert = require('node:assert/strict');
const { test, before, after, beforeEach, mock } = require('node:test');
const createFixture = require('./support/identity-http');
const { hash } = require('../identity/service');
let f;
let logs = [];
before(async () => {
  mock.method(console, 'log', (...args) => logs.push(args.join(' ')));
  mock.method(console, 'warn', (...args) => logs.push(args.join(' ')));
  f = await createFixture();
});
beforeEach(async () => { await f.reset(); logs = []; });
after(async () => { if (f) await f.close(); });
const proof = () => new URL(f.mail.at(-1).link).hash.slice(7);
const csrf = { 'X-RVDL-CSRF': '1' };
const get = (path, cookie) => f.request(path, { headers: { ...csrf, ...(cookie ? { Cookie: cookie } : {}) } });
const noStripe = () => assert.equal(f.calls.some(call => call.startsWith('stripe.')), false, 'deny before Stripe');
async function issue(email = 'a@example.invalid') {
  const response = await f.json('auth/login', { email });
  assert.equal(response.status, 202);
  return proof();
}
test('login initiation sends only to stored email; known and unknown responses match', async () => {
  const a = await f.json('auth/login', { email: ' A@EXAMPLE.INVALID ' });
  const token = proof();
  const b = await f.json('auth/login', { email: 'unknown@example.invalid' });
  assert.equal(a.status, 202); assert.equal(b.status, 202);
  assert.deepEqual(a.body, b.body);
  assert.equal(f.mail.length, 1); assert.equal(f.mail[0].to, 'a@example.invalid');
  assert.equal(Boolean(a.cookie), false);
  assert.equal(JSON.stringify(a.body).includes(token), false);
  assert.equal(f.prisma.tables.loginProof[0].tokenHash === hash(token), true);
  assert.equal(JSON.stringify(f.prisma.tables).includes(token), false, 'raw proof must not be stored');
});
test('valid verification sets secure HttpOnly cookie and identity comes from the server', async () => {
  const token = await issue();
  const verified = await f.json('auth/verify', { token });
  assert.equal(verified.status, 200);
  const header = verified.headers.get('set-cookie');
  assert.equal(header.startsWith('__Host-rv-session='), true);
  for (const attribute of ['HttpOnly', 'Secure', 'SameSite=Lax', 'Path=/', 'Max-Age=604800']) assert.equal(header.includes(attribute), true);
  assert.equal(Boolean(verified.body.token || verified.body.authToken), false);
  const session = await get('auth/session', verified.cookie);
  assert.equal(session.status, 200); assert.equal(session.body.user.id, 1);
  assert.equal(session.headers.get('cache-control'), 'no-store');
  const raw = verified.cookie.split('=')[1];
  assert.equal(f.prisma.tables.identitySession[0].tokenHash === hash(raw), true);
  assert.equal(JSON.stringify(f.prisma.tables).includes(raw), false);
  assert.equal(logs.some(line => line.includes(token) || line.includes(raw)), false);
});
test('invalid, expired and reused proofs have the same rejection', async () => {
  const token = await issue();
  const invalid = await f.json('auth/verify', { token: 'x'.repeat(43) });
  assert.equal(invalid.status, 401);
  f.advance(15 * 60 * 1000);
  const expired = await f.json('auth/verify', { token });
  assert.equal(expired.status, 401); assert.deepEqual(expired.body, invalid.body);
  const fresh = await issue();
  assert.equal((await f.json('auth/verify', { token: fresh })).status, 200);
  const reused = await f.json('auth/verify', { token: fresh });
  assert.equal(reused.status, 401); assert.deepEqual(reused.body, invalid.body);
});
test('concurrent proof reuse creates exactly one session (synthetic transaction double)', async () => {
  const token = await issue();
  const results = await Promise.all(Array.from({ length: 12 }, () => f.json('auth/verify', { token })));
  assert.equal(results.filter(r => r.status === 200).length, 1);
  assert.equal(results.filter(r => r.status === 401).length, 11);
  assert.equal(f.prisma.tables.identitySession.length, 1);
});
test('session insertion failure rolls consumption back and permits retry', async () => {
  const token = await issue();
  f.prisma.failNextSession();
  const failed = await f.json('auth/verify', { token });
  assert.equal(failed.status, 500); assert.equal(Boolean(failed.cookie), false);
  assert.deepEqual(failed.body, { error: { message: 'Request could not be completed' } });
  assert.equal(f.prisma.tables.loginProof[0].consumedAt, null);
  assert.equal((await f.json('auth/verify', { token })).status, 200);
});
test('delivery failure discloses nothing and even the attempted proof is unusable', async () => {
  f.failMail();
  const response = await f.json('auth/login', { email: 'a@example.invalid' });
  const token = proof();
  assert.equal(response.status, 202);
  assert.equal(JSON.stringify(response.body).includes(token), false);
  assert.deepEqual(logs, ['login_delivery_failed']);
  assert.equal(f.prisma.tables.loginProof.length, 0);
  assert.equal((await f.json('auth/verify', { token })).status, 401);
});
test('pending delivery and activation failure cannot authenticate', async () => {
  const token = await issue();
  f.prisma.tables.loginProof[0].delivered = false;
  assert.equal((await f.json('auth/verify', { token })).status, 401);
  const original = f.prisma.loginProof.updateMany;
  f.prisma.loginProof.updateMany = async () => { throw new Error('sensitive database detail'); };
  try {
    assert.equal((await f.json('auth/login', { email: 'a@example.invalid' })).status, 202);
    assert.equal((await f.json('auth/verify', { token: proof() })).status, 401);
  } finally { f.prisma.loginProof.updateMany = original; }
});
test('proof and session credentials cannot substitute for one another', async () => {
  const token = await issue();
  assert.equal((await get('auth/session', f.config.cookieName + '=' + token)).status, 401);
  const result = await f.json('auth/verify', { token });
  assert.equal((await f.json('auth/verify', { token: result.cookie.split('=')[1] })).status, 401);
});
test('verification cannot select a different user or email through request fields', async () => {
  const token = await issue();
  assert.equal((await f.json('auth/verify', { token, email: 'b@example.invalid' })).status, 400);
  assert.equal((await f.json('auth/verify', { token, userId: 2 })).status, 400);
  const result = await f.json('auth/verify', { token });
  assert.equal(result.status, 200);
  assert.equal(result.body.user.id, 1);
  assert.equal((await get('auth/session', result.cookie)).body.user.id, 1);
});
test('session expires exactly at its absolute lifetime', async () => {
  const cookie = await f.login();
  f.advance(7 * 86400000 - 1);
  assert.equal((await get('auth/session', cookie)).status, 200);
  f.advance(1);
  assert.equal((await get('auth/session', cookie)).status, 401);
});
test('logout revokes a copied credential and clears the cookie idempotently', async () => {
  const cookie = await f.login();
  const response = await f.json('auth/logout', {}, cookie);
  assert.equal(response.status, 204);
  assert.equal(response.headers.get('set-cookie').includes('Expires=Thu, 01 Jan 1970'), true);
  assert.equal((await get('auth/session', cookie)).status, 401);
  assert.equal((await f.json('auth/logout', {}, cookie)).status, 204);
  assert.equal((await f.json('auth/logout', {})).status, 204);
});
test('a new verified login revokes the previous browser session', async () => {
  const oldCookie = await f.login();
  const token = await issue();
  const current = await f.json('auth/verify', { token }, oldCookie);
  assert.equal(current.status, 200);
  assert.equal((await get('auth/session', oldCookie)).status, 401);
  assert.equal((await get('auth/session', current.cookie)).status, 200);
});
test('deleted users and changed email addresses invalidate outstanding identity', async () => {
  const cookie = await f.login();
  const token = await issue();
  f.user.email = 'changed@example.invalid';
  assert.equal((await get('auth/session', cookie)).status, 401);
  assert.equal((await f.json('auth/verify', { token })).status, 401);
  f.user.email = 'a@example.invalid';
  await f.prisma.user.delete({ where: { id: 1 } });
  assert.equal((await get('auth/session', cookie)).status, 401);
  assert.equal((await f.json('auth/verify', { token })).status, 401);
});
test('ambiguous case-duplicate emails do not select an arbitrary account', async () => {
  f.prisma.tables.user.push({ ...f.user, id: 4, email: 'A@example.invalid' });
  assert.equal((await f.json('auth/login', { email: 'a@example.invalid' })).status, 202);
  assert.equal(f.mail.length, 0);
});
test('email and IP limits include unknown emails and resist spoofed forwarding headers', async () => {
  for (let n = 0; n < 5; n++) assert.equal((await f.json('auth/login', { email: 'unknown@example.invalid' })).status, 202);
  assert.equal((await f.json('auth/login', { email: 'unknown@example.invalid' })).status, 429);
  for (let n = 0; n < 14; n++) assert.equal((await f.json('auth/login', { email: 'unknown' + n + '@example.invalid' }, null, { 'X-Forwarded-For': '192.0.2.' + n })).status, 202);
  assert.equal((await f.json('auth/login', { email: 'different@example.invalid' }, null, { 'X-Forwarded-For': '198.51.100.1' })).status, 429);
  f.advance(15 * 60000);
  assert.equal((await f.json('auth/login', { email: 'unknown@example.invalid' })).status, 202);
});
test('verification attempts are limited before repeated lookup', async () => {
  for (let n = 0; n < 60; n++) assert.equal((await f.json('auth/verify', { token: 'x'.repeat(43) })).status, 401);
  assert.equal((await f.json('auth/verify', { token: 'x'.repeat(43) })).status, 429);
});
for (const email of [null, {}, [], 'bad', 'a\r\n@example.invalid', 'a'.repeat(65) + '@example.invalid']) {
  test('malformed email input is rejected before mail or database access: ' + typeof email + String(email).length, async () => {
    const response = await f.json('auth/login', { email });
    assert.equal(response.status, 400); assert.deepEqual(f.calls, []);
  });
}
test('unexpected fields, malformed JSON, oversized bodies and form encoding are rejected', async () => {
  assert.equal((await f.json('auth/login', { email: 'a@example.invalid', to: 'b@example.invalid' })).status, 400);
  const bad = await f.request('auth/login', { method: 'POST', headers: { ...csrf, 'Content-Type': 'application/json' }, body: '{"private":"sensitive-broken' });
  assert.equal(bad.status, 400); assert.equal(JSON.stringify(bad.body).includes('sensitive'), false);
  assert.equal((await f.json('auth/login', { email: 'x'.repeat(20000) })).status, 413);
  assert.equal((await f.request('auth/login', { method: 'POST', headers: { ...csrf, 'Content-Type': 'application/x-www-form-urlencoded' }, body: 'email=a%40example.invalid' })).status, 400);
});
test('CSRF and unexpected origins are rejected and CORS allows only the configured client', async () => {
  assert.equal((await f.json('auth/login', { email: 'a@example.invalid' }, null, { 'X-RVDL-CSRF': '' })).status, 403);
  assert.equal((await f.json('auth/login', { email: 'a@example.invalid' }, null, { Origin: 'https://evil.example.invalid' })).status, 403);
  assert.equal((await f.json('auth/login', { email: 'a@example.invalid' }, null, { Origin: 'null' })).status, 403);
  const response = await f.request('auth/login', { method: 'OPTIONS', headers: { Origin: f.config.clientOrigin, 'Access-Control-Request-Method': 'POST', 'Access-Control-Request-Headers': 'content-type,x-rvdl-csrf' } });
  assert.equal(response.status, 204);
  assert.equal(response.headers.get('access-control-allow-origin'), f.config.clientOrigin);
  assert.equal(response.headers.get('access-control-allow-credentials'), 'true');
  assert.deepEqual(f.calls, []);
});
test('legacy JWT headers and tampered or missing cookies cannot authenticate', async () => {
  const cookie = await f.login();
  assert.equal((await f.request('auth/session', { headers: { jwt: cookie.split('=')[1] } })).status, 401);
  assert.equal((await get('auth/session', f.config.cookieName + '=' + 'x'.repeat(43))).status, 401);
  assert.equal((await get('auth/session')).status, 401);
});
test('session identity is self-only and ordinary users cannot enumerate or complete deletion', async () => {
  const cookie = await f.login();
  const own = await get('auth/session', cookie);
  assert.equal(own.body.user.id, 1);
  assert.equal((await get('user/synthetic-public-key', cookie)).status, 403);
  assert.equal((await get('user/owner/deletions/2/synthetic-public-key', cookie)).status, 403);
  assert.equal((await f.json('user/owner/deletions/2/complete/synthetic-public-key', { dashboardClosed: true, review: 'a'.repeat(64) }, cookie)).status, 403);
  assert.equal(f.prisma.tables.user.length, 3);
});
test('admin listing checks fresh roles and direct/bulk deletion bypasses are removed', async () => {
  const cookie = await f.login('admin@example.invalid');
  assert.equal((await get('user/synthetic-public-key', cookie)).status, 200);
  for (const path of ['user/synthetic-public-key?id=2','user/all/synthetic-public-key'])
    assert.equal((await f.request(path, { method: 'DELETE', headers: { ...csrf, Cookie: cookie } })).status, 404);
  f.prisma.tables.user.find(u => u.id === 3).isAdmin = false;
  assert.equal((await get('user/synthetic-public-key', cookie)).status, 403);
  assert.equal((await get('user/owner/deletions/2/synthetic-public-key', cookie)).status, 403);
  assert.equal(f.prisma.tables.user.length, 3);
});
for (const [path, body] of [
  ['user/create-portal-session/synthetic-public-key', { customerId: 'cus_test_b' }],
  ['payment/checkout/synthetic-public-key', { customerId: 'cus_test_b' }],
  ['payment/checkout-session-object/synthetic-public-key', { sessionId: 'cs_test_b' }],
]) test('normal account route rejects anonymous and foreign authority before Stripe: ' + path, async () => {
  assert.equal((await f.json(path, body)).status, 401); noStripe();
  const cookie = await f.login(); f.calls.length = 0;
  assert.equal((await f.json(path, body, cookie)).status, path.includes('session-object') ? 403 : 400); noStripe();
});
test('trusted Portal and ownership denial use only current identity and owned attempts', async () => {
  const cookie = await f.login(); f.calls.length = 0;
  const portal = await f.json('user/create-portal-session/synthetic-public-key', {}, cookie);
  assert.equal(portal.status, 200); assert.equal(portal.body.reason, 'portal_open');
  assert.equal(f.calls.filter(c => c.startsWith('stripe.')).join(','), 'stripe.portal.create');
  f.calls.length = 0;
  assert.equal((await f.json('payment/checkout-session-object/synthetic-public-key', { sessionId: 'cs_unrecorded' }, cookie)).status, 403);
  noStripe();
});
test('normal purchase routes enforce CSRF, configured origin, public key and authority-free input', async () => {
  const cookie = await f.login(); f.calls.length = 0;
  assert.equal((await f.request('payment/account/synthetic-public-key', { headers: { Cookie: cookie } })).status, 403);
  assert.equal((await f.json('payment/checkout/wrong', {}, cookie)).status, 403);
  assert.equal((await f.json('payment/checkout/synthetic-public-key', {}, cookie, { Origin: 'https://foreign.example.invalid' })).status, 403);
  noStripe();
});
test('superseded financial/creation APIs are absent, including for administrators', async () => {
  const cookie = await f.login('admin@example.invalid'); f.calls.length = 0;
  for (const [method,path] of [
    ['GET','payment/checkout-session/synthetic-public-key/cus_test_admin'],
    ['GET','payment/checkout-session-resubscribe/synthetic-public-key/cus_test_admin'],
    ['PUT','payment/update-payment/synthetic-public-key'],
    ['GET','payment/webhookLogs'],
    ['GET','user/find-by-stripe-id/synthetic-public-key'],
  ]) assert.equal((await f.request(path, { method, headers: { ...csrf, Cookie: cookie } })).status, 404);
  noStripe();
});
