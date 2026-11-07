const assert = require('node:assert/strict');
const { test, before, after, beforeEach } = require('node:test');
const createFixture = require('./support/identity-http');
let fixture;
before(async () => {
  fixture = await createFixture();
});
beforeEach(async () => fixture.reset());
after(async () => {
  if (fixture) await fixture.close();
});
test('HTTP fixture mounts the full application without contacting services', async () => {
  const result = await fixture.request('auth/session');
  assert.equal(result.status, 401);
  assert.deepEqual(fixture.calls, []);
});
test('normal signup creates only an unprivileged local account without provider work', async () => {
  const result = await fixture.json('user/synthetic-public-key', {
    firstName: 'Test',
    lastName: 'User',
    email: 'new@example.invalid',
  });
  assert.equal(result.status, 202);
  assert.deepEqual(result.body, { accepted: true });
  assert.equal(
    fixture.calls.some((c) => c.startsWith('stripe.')),
    false
  );
  assert.equal(fixture.prisma.tables.billingOperation.length, 0);
  assert.equal(fixture.prisma.tables.user.at(-1).isAdmin, false);
});
test('normal routes select purchase and deletion with persisted session/admin protection', async () => {
  const cookie = await fixture.login();
  assert.equal(
    (await fixture.json('payment/checkout/synthetic-public-key', {}, cookie)).status,
    200
  );
  assert.equal(
    (await fixture.json('user/account-deletion/synthetic-public-key', { confirm: true }, cookie))
      .status,
    404
  );
  assert.equal(
    (
      await fixture.request('user/owner/deletions/1/synthetic-public-key', {
        headers: { Cookie: cookie, 'X-RVDL-CSRF': '1' },
      })
    ).status,
    403
  );
  assert.equal(
    (
      await fixture.request('payment/account/synthetic-public-key', {
        headers: { Cookie: cookie, 'X-RVDL-CSRF': '1' },
      })
    ).status,
    200
  );
  assert.equal(
    fixture.calls.some((call) => call === 'stripe.checkout.create'),
    false,
    'unselected existing account needs review, never a guessed second purchase'
  );
});
