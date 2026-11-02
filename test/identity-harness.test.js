const assert = require('node:assert/strict');
const { test, before, after, beforeEach } = require('node:test');
const createFixture = require('./support/identity-http');
let fixture;
before(async () => { fixture = await createFixture(); });
beforeEach(async () => fixture.reset());
after(async () => { if (fixture) await fixture.close(); });
test('HTTP fixture mounts the full application without contacting services', async () => {
  const result = await fixture.request('auth/session');
  assert.equal(result.status, 401);
  assert.deepEqual(fixture.calls, []);
});
test('registration smoke check uses only synthetic database and Stripe doubles', async () => {
  const result = await fixture.json('user/synthetic-public-key', { firstName: 'Test', lastName: 'User', email: 'new@example.invalid' });
  assert.equal(result.status, 200);
  assert.equal(result.body.newUserStripeId, 'cus_test_new');
  assert.equal(Boolean(result.body.token), false);
  assert.equal(fixture.calls.filter(c => c.startsWith('stripe.')).join(','), 'stripe.customers.create');
  assert.equal(fixture.prisma.tables.billingOperation[0].state, 'completed');
  assert.equal(fixture.prisma.tables.user.at(-1).isAdmin, false);
});
test('Stripe-led candidate routes are absent from normal application composition', async () => {
  const cookie = await fixture.login();
  assert.equal((await fixture.json('payment/checkout/synthetic-public-key', {}, cookie)).status, 404);
  assert.equal((await fixture.request('payment/account/synthetic-public-key', { headers: { Cookie: cookie } })).status, 404);
  assert.equal(fixture.calls.some(call => call === 'stripe.checkout.create'), false);
});
