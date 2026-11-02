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

test('signed unrelated customer.created is a durable review and never provisions identity', async () => {
  f.stripe.resources.customers.push({ id: 'cus_test_webhook', livemode: false, metadata: {} });
  const body = payload();
  assert.equal((await post(body, sign(body))).status, 200);
  assert.equal(f.prisma.tables.stripeEventReceipt[0].outcome, 'review');
  assert.equal(f.prisma.tables.user.length, 3);
  assert.equal(f.calls.includes('user.create'), false);
  assert.deepEqual(logs, []);
});
test('signed customer.deleted retains login and records terminal billing state', async () => {
  f.stripe.resources.customers[0].deleted = true;
  const event = JSON.parse(payload('customer.deleted')); event.data.object.id = 'cus_test_a';
  const body = JSON.stringify(event, null, 2);
  assert.equal((await post(body, sign(body))).status, 200);
  assert.equal(f.prisma.tables.user.length, 3);
  assert.ok(f.prisma.tables.billingCustomer[0].stripeDeletedAt);
  assert.equal(f.calls.includes('user.delete'), false);
  assert.deepEqual(logs, []);
});
test('a verified unhandled event is durably ignored without downstream provider calls or logging', async () => {
  const body = payload('synthetic.unhandled');
  assert.equal((await post(body, sign(body))).status, 200);
  assert.equal(f.prisma.tables.stripeEventReceipt[0].outcome, 'ignored');
  assert.equal(f.calls.some(c => c.startsWith('stripe.')), false);
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
    assert.equal(customerParameters.name, 'JSON Listener');
    assert.equal(customerParameters.email, 'json@example.invalid');
    assert.equal(customerParameters.metadata.billing_operation, f.prisma.tables.billingOperation[0].id);
    assert.equal(f.calls.filter(c => c.startsWith('stripe.')).join(','), 'stripe.customers.create');
    assert.equal(f.prisma.tables.billingCustomer.some(b => b.customerId === 'cus_test_new'), true);
    assert.deepEqual(result.body, { newUserStripeId: 'cus_test_new' });
  } finally { f.stripe.customers.create = original; }
});
