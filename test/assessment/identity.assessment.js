// Desired security behavior, deliberately separate from the passing smoke suite.
// Run `npm run assess:identity`. Known failures exit nonzero; do not mark them
// skipped/TODO or interpret `npm test` as authentication acceptance.
const assert = require('node:assert/strict');
const { test, before, after, mock } = require('node:test');
const createFixture = require('../support/identity-http');

let fixture;
before(async () => {
  mock.method(console, 'log', () => {});
  fixture = await createFixture();
});
after(async () => { if (fixture) await fixture.close(); });

test('knowing an email must not disclose a usable login credential', async () => {
  const result = await fixture.request('auth/email-token/synthetic-public-key/a@example.invalid');
  // Compare a boolean so assertion output can never disclose a credential.
  assert.equal(Boolean(result.body.token || result.body.authToken), false);
});

for (const [name, path, method] of [
  ['public API key must not mint admin access', 'auth/admin-token/synthetic-public-key', 'GET'],
  ['shared account-update bypass must not mint a session', 'auth/account-update-token/synthetic-public-key/a@example.invalid/09876', 'GET'],
  ['public API key must not enumerate users', 'user/synthetic-public-key', 'GET'],
  ['public API key must not read another customer account', 'user/find-by-stripe-id/synthetic-public-key?stripeId=cus_test_b', 'GET'],
  ['public API key must not delete an account', 'user/synthetic-public-key?id=2', 'DELETE'],
  ['public API key must not delete every account', 'user/all/synthetic-public-key', 'DELETE'],
]) {
  test(name, async () => {
    const result = await fixture.request(path, { method });
    assert.equal([401, 403, 404, 410].includes(result.status), true, 'request must be denied');
    assert.deepEqual(fixture.calls, [], 'deny before database or Stripe calls');
  });
}

test('a directly disclosed email token must not exchange for a session', async () => {
  const issued = await fixture.request('auth/email-token/synthetic-public-key/a@example.invalid');
  if (!issued.body.token) return; // No disclosed credential means this bypass is closed.
  const result = await fixture.request(`auth/session-token/synthetic-public-key/a@example.invalid/${encodeURIComponent(issued.body.token)}`);
  assert.equal(Boolean(result.body.authToken), false);
});
