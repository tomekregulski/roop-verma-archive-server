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
test('account lookup is self-only and ordinary users cannot list or delete users', async () => {
  const cookie = await f.login();
  assert.equal((await get('user/find-by-stripe-id/synthetic-public-key?stripeId=cus_test_a', cookie)).status, 200);
  f.calls.length = 0;
  assert.equal((await get('user/find-by-stripe-id/synthetic-public-key?stripeId=cus_test_b', cookie)).status, 403);
  assert.equal(f.calls.includes('subscription.findMany'), false);
  assert.equal((await get('user/synthetic-public-key', cookie)).status, 403);
  assert.equal((await f.request('user/synthetic-public-key?id=2', { method: 'DELETE', headers: { ...csrf, Cookie: cookie } })).status, 403);
  assert.equal(f.prisma.tables.user.length, 3);
});
test('admin listing and individual deletion work; roles are checked fresh and bulk deletion is removed', async () => {
  const cookie = await f.login('admin@example.invalid');
  assert.equal((await get('user/synthetic-public-key', cookie)).status, 200);
  assert.equal((await f.request('user/synthetic-public-key?id=2oops', { method: 'DELETE', headers: { ...csrf, Cookie: cookie } })).status, 400);
  assert.equal((await f.request('user/synthetic-public-key?id=2', { method: 'DELETE', headers: { ...csrf, Cookie: cookie } })).status, 204);
  f.prisma.tables.user.find(u => u.id === 3).isAdmin = false;
  assert.equal((await get('user/synthetic-public-key', cookie)).status, 403);
  assert.equal((await f.request('user/all/synthetic-public-key', { method: 'DELETE', headers: { ...csrf, Cookie: cookie } })).status, 410);
});
const endpoints = [
  ['user/create-portal-session/synthetic-public-key', 'POST', { customerId: 'cus_test_b' }],
  ['payment/checkout-session/synthetic-public-key/cus_test_b', 'GET'],
  ['payment/checkout-session-resubscribe/synthetic-public-key/cus_test_b', 'GET'],
  ['payment/checkout-session-object/synthetic-public-key', 'POST', { sessionId: 'cs_test_b' }],
  ['payment/update-payment/synthetic-public-key', 'PUT', { stripe_id: 'cus_test_b', subscription_id: 'sub_test_b', payment_method: 'pm_test_b' }],
];
for (const [path, method, body] of endpoints) test('account route rejects anonymous and cross-account before Stripe: ' + path.split('/')[1], async () => {
  async function call(cookie) {
    return f.request(path, { method, headers: { ...csrf, 'Content-Type': 'application/json', ...(cookie ? { Cookie: cookie } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) });
  }
  f.prisma.tables.checkoutOwnership.push({ sessionId: 'cs_test_b', userId: 2, customerId: 'cus_test_b' });
  assert.equal((await call()).status, 401); noStripe();
  const cookie = await f.login(); f.calls.length = 0;
  assert.equal((await call(cookie)).status, 403); noStripe();
});
test('authorized portal, checkout, resubscription, lookup and payment update still work', async () => {
  const cookie = await f.login(); f.calls.length = 0;
  const portal = await f.json('user/create-portal-session/synthetic-public-key', {}, cookie);
  assert.equal(portal.status, 200); assert.equal(portal.body.session.customer, 'cus_test_a');
  for (const endpoint of ['checkout-session', 'checkout-session-resubscribe']) {
    const checkout = await get('payment/' + endpoint + '/synthetic-public-key/cus_test_a', cookie);
    assert.equal(checkout.status, 200); assert.equal(checkout.body.customer, 'cus_test_a');
    assert.equal(f.prisma.tables.checkoutOwnership.some(row => row.sessionId === checkout.body.id && row.userId === 1), true);
    assert.equal((await f.json('payment/checkout-session-object/synthetic-public-key', { sessionId: checkout.body.id }, cookie)).status, 200);
  }
  const update = await f.request('payment/update-payment/synthetic-public-key', { method: 'PUT', headers: { ...csrf, Cookie: cookie, 'Content-Type': 'application/json' },
    body: JSON.stringify({ subscription_id: 'sub_test_a', payment_method: 'pm_test_a' }) });
  assert.equal(update.status, 200);
  assert.equal(f.calls.includes('stripe.paymentMethods.attach'), true);
  assert.equal(f.calls.includes('stripe.customers.update'), true);
});
test('unrecorded checkout IDs and foreign subscriptions fail before Stripe', async () => {
  const cookie = await f.login(); f.calls.length = 0;
  assert.equal((await f.json('payment/checkout-session-object/synthetic-public-key', { sessionId: 'cs_unrecorded' }, cookie)).status, 403);
  assert.equal((await f.request('payment/update-payment/synthetic-public-key', { method: 'PUT', headers: { ...csrf, Cookie: cookie, 'Content-Type': 'application/json' },
    body: JSON.stringify({ stripe_id: 'cus_test_a', subscription_id: 'sub_test_b', payment_method: 'pm_test_a' }) })).status, 403);
  noStripe();
});
test('unsafe authenticated GETs require CSRF protection and wrong API keys cannot continue', async () => {
  const cookie = await f.login(); f.calls.length = 0;
  assert.equal((await f.request('payment/checkout-session/synthetic-public-key/cus_test_a', { headers: { Cookie: cookie } })).status, 403);
  assert.equal((await get('payment/checkout-session/wrong/cus_test_a', cookie)).status, 403);
  noStripe();
});
test('webhook logs require an administrator session', async () => {
  assert.equal((await get('payment/webhookLogs')).status, 401);
  const cookie = await f.login();
  assert.equal((await get('payment/webhookLogs', cookie)).status, 403);
});
