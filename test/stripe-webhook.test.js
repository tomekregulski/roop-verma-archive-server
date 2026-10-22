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
    id: 'evt_synthetic_webhook', object: 'event', type,
    data: { object: { id: 'cus_test_webhook', name: 'Synthetic Listener', email: 'listener@example.invalid' } },
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

test('valid signature dispatches customer.created and persists the signed customer fields', async () => {
  const body = payload();
  const response = await post(body, sign(body));
  assert.equal(response.status, 200);
  assert.deepEqual(response.body, { received: true });
  assert.deepEqual(f.calls, ['user.create']);
  assert.equal(f.prisma.tables.user.length, 4);
  assert.deepEqual(f.prisma.tables.user.at(-1), {
    email: 'listener@example.invalid', firstName: 'Synthetic', lastName: 'Listener',
    stripeId: 'cus_test_webhook', isAdmin: false,
  });
  assert.deepEqual(logs, []);
});

test('valid signature dispatches the existing customer.deleted lookup and deletion', async () => {
  const event = JSON.parse(payload('customer.deleted'));
  event.data.object.id = 'cus_test_a';
  const body = JSON.stringify(event, null, 2);
  const response = await post(body, sign(body));
  assert.equal(response.status, 200);
  assert.deepEqual(f.calls, ['user.findUnique', 'user.delete']);
  assert.deepEqual(f.prisma.tables.user.map(user => user.stripeId), ['cus_test_b', 'cus_test_admin']);
  assert.deepEqual(logs, []);
});

test('a verified unhandled event retains acknowledgement without service calls or payload logging', async () => {
  const body = payload('synthetic.unhandled');
  const response = await post(body, sign(body));
  assert.equal(response.status, 200);
  assert.deepEqual(response.body, { received: true });
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

test('ordinary JSON registration still parses fields and passes them to the intended Stripe service', async () => {
  const original = f.stripe.customers.create;
  let customerParameters;
  f.stripe.customers.create = async params => { customerParameters = params; return original(params); };
  try {
    const result = await f.json('user/synthetic-public-key', {
      firstName: 'JSON', lastName: 'Listener', email: 'json@example.invalid',
    });
    assert.equal(result.status, 200);
    assert.deepEqual(customerParameters, { name: 'JSON Listener', email: 'json@example.invalid' });
    assert.deepEqual(f.calls, ['rateLimit.increment', 'user.findMany', 'stripe.customers.create']);
    assert.deepEqual(result.body, { newUserStripeId: 'cus_test_new' });
  } finally { f.stripe.customers.create = original; }
});
