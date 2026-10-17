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
  assert.deepEqual(fixture.calls, ['rateLimit.increment', 'user.findMany', 'stripe.customers.create']);
});
