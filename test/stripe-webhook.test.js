const assert = require('node:assert/strict');
const { test, before, after, beforeEach, mock } = require('node:test');
const { webhooks } = require('stripe');
const createFixture = require('./support/identity-http');

const secret = 'whsec_synthetic_fixture_only';
let f;
let logs;
before(async () => {
  for (const method of ['log', 'warn', 'error']) mock.method(console, method, (...args) => logs.push(args));
  f = await createFixture();
});
beforeEach(async () => {
  await f.reset();
  logs = [];
  process.env.STRIPE_WEBHOOK_SECRET = secret;
});
after(async () => { if (f) await f.close(); });

function payload(type = 'customer.created') {
  return JSON.stringify({
    ...require('./support/billing-provider').event(type, 'cus_test_webhook', 'evt_synthetic_webhook'),
    data: { object: { id: 'cus_test_webhook', object: 'customer', name: 'Synthetic Listener', email: 'listener@example.invalid' } },
  }, null, 2); // Deliberate whitespace: reserializing JSON must not substitute for raw bytes.
}
function sign(body, options = {}) {
  return webhooks.generateTestHeaderString({ payload: body, secret, ...options });
}
function post(body, signature, contentType = 'application/json') {
  return f.request('payment/webhooks', {
    method: 'POST', body,
    headers: { 'Content-Type': contentType, ...(signature === undefined ? {} : { 'Stripe-Signature': signature }) },
  });
}
async function assertRejected(body, signature, status = 400, contentType) {
  const snapshot = structuredClone(f.prisma.tables);
  const result = await post(body, signature, contentType);
  assert.equal(result.status, status);
  assert.deepEqual(result.body, { error: { message: status === 503 ? 'Webhook is not configured' : 'Invalid webhook' } });
  assert.deepEqual(f.calls, [], 'reject before any database read/write, mail or downstream Stripe call');
  assert.deepEqual(f.prisma.tables, snapshot, 'rejection must leave all application data unchanged');
  assert.deepEqual(logs, [], 'do not log SDK errors, signatures or event/customer payloads');
}

for (const type of ['customer.created', 'customer.deleted', 'synthetic.unhandled'])
 test('verified unrelated notification performs no provisioning, ledger or provider work: ' + type, async () => {
  const snapshot = structuredClone(f.prisma.tables);
  const body = payload(type);
  assert.equal((await post(body, sign(body))).status, 200);
  assert.deepEqual(f.prisma.tables, snapshot);
  assert.deepEqual(f.calls, []);
  assert.deepEqual(logs, []);
});

for (const type of ['customer.created', 'customer.deleted', 'customer.subscription.created',
  'customer.subscription.updated', 'customer.subscription.deleted']) {
  test('missing signature cannot dispatch ' + type, async () => {
    await assertRejected(payload(type));
  });
}

test('malformed signature is rejected without service calls', async () => {
  await assertRejected(payload(), 'synthetic-invalid-signature');
});
test('a well-formed header signed with another secret is rejected without service calls', async () => {
  const body = payload();
  await assertRejected(body, sign(body, { secret: 'whsec_synthetic_wrong_secret' }));
});
test('modifying a signed customer mapping is rejected without service calls', async () => {
  const body = payload();
  await assertRejected(body.replace('cus_test_webhook', 'cus_test_forged'), sign(body));
});
test('changing only signed JSON whitespace is rejected without service calls', async () => {
  const body = payload();
  await assertRejected(JSON.stringify(JSON.parse(body)), sign(body));
});
test('a correctly signed stale request is rejected by the SDK timestamp tolerance', async () => {
  const body = payload();
  await assertRejected(body, sign(body, { timestamp: Math.floor(Date.now() / 1000) - 600 }));
});

for (const value of [undefined, '', '   ']) {
  test('missing/blank signing-secret configuration fails closed: ' + JSON.stringify(value), async () => {
    if (value === undefined) delete process.env.STRIPE_WEBHOOK_SECRET;
    else process.env.STRIPE_WEBHOOK_SECRET = value;
    const body = payload();
    await assertRejected(body, sign(body), 503);
  });
}

test('an unparsed non-JSON body cannot bypass verification', async () => {
  const body = payload();
  await assertRejected(body, sign(body), 400, 'text/plain');
});
test('signed malformed JSON is rejected without exposing parser errors or touching services', async () => {
  const body = '{"synthetic_private_field":';
  await assertRejected(body, sign(body));
});

test('ordinary JSON registration retains parsing and creates a local verified-before-purchase identity', async () => {
  const result = await f.json('user/synthetic-public-key', {
    firstName: 'JSON', lastName: 'Listener', email: 'json@example.invalid',
  });
  assert.equal(result.status, 202);
  const user = f.prisma.tables.user.find(u => u.email === 'json@example.invalid');
  assert.equal(user.firstName, 'JSON');
  assert.equal(user.stripeId, null);
  assert.equal(user.isAdmin, false);
  assert.equal(f.calls.some(c => c.startsWith('stripe.')), false);
  assert.deepEqual(result.body, { accepted: true });
});
