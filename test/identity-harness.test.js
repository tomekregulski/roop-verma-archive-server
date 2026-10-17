const assert = require('node:assert/strict');
const { test, before, after, mock } = require('node:test');
const createFixture = require('./support/identity-http');

let fixture;
before(async () => {
  mock.method(console, 'log', () => {});
  fixture = await createFixture();
});
after(async () => { if (fixture) await fixture.close(); });

test('HTTP fixture mounts the real routers without contacting services', async () => {
  const result = await fixture.request('auth/session-token/synthetic-public-key/a@example.invalid/invalid');
  assert.equal(result.status, 500);
  assert.deepEqual(fixture.calls, ['user.findUnique']);
  assert.equal(typeof result.body.error.message, 'string');
});

test('registration smoke check uses only synthetic database and Stripe doubles', async () => {
  const previousFind = fixture.prisma.user.findUnique;
  fixture.prisma.user.findUnique = async () => {
    fixture.calls.push('user.findUnique');
    return null;
  };
  try {
    const result = await fixture.request('user/synthetic-public-key', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ firstName: 'Test', lastName: 'User', email: 'new@example.invalid' }),
    });
    assert.equal(result.status, 200);
    assert.equal(result.body.newUserStripeId, 'cus_test_new');
    assert.deepEqual(fixture.calls, ['user.findUnique', 'stripe.customers.create']);
  } finally {
    fixture.prisma.user.findUnique = previousFind;
  }
});
