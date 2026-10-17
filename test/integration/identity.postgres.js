// Explicit opt-in, real PostgreSQL + real Prisma; mail and Stripe remain fake.
// Creates/drops only a uniquely named schema inside a dedicated loopback DB.
const assert = require('node:assert/strict');
const { test, before, beforeEach, after } = require('node:test');
const { randomUUID } = require('node:crypto');
const { spawnSync } = require('node:child_process');
const { PrismaClient } = require('@prisma/client');
const createFixture = require('../support/identity-http');
let db, admin, f, schema, url;
function cli(args) {
  return spawnSync(process.execPath, ['node_modules/prisma/build/index.js', ...args], {
    cwd: require('node:path').resolve(__dirname, '../..'), encoding: 'utf8', timeout: 60000,
    env: { ...process.env, DATABASE_URL: url.href, HEROKU_POSTGRESQL_BROWN_URL: url.href },
  });
}
before(async () => {
  let candidate;
  try { candidate = new URL(process.env.TEST_DATABASE_URL); } catch { throw new Error('Set TEST_DATABASE_URL to the dedicated loopback rvdl_identity_test database'); }
  if (!['postgres:', 'postgresql:'].includes(candidate.protocol) || !['localhost', '127.0.0.1', '[::1]'].includes(candidate.hostname) ||
      candidate.pathname !== '/rvdl_identity_test' || [...candidate.searchParams.keys()].some(k => !['connection_limit'].includes(k))) {
    throw new Error('Integration tests refuse non-loopback databases, other DB names, and unexpected URL options');
  }
  admin = new PrismaClient({ datasources: { db: { url: candidate.href } } });
  schema = 'identity_test_' + randomUUID().replaceAll('-', '');
  await admin.$executeRawUnsafe('CREATE SCHEMA "' + schema + '"');
  url = candidate; url.searchParams.set('schema', schema);
  const migration = cli(['migrate', 'deploy']);
  assert.equal(migration.status, 0, 'full migration replay must succeed in the disposable schema');
  db = new PrismaClient({ datasources: { db: { url: url.href } } });
  f = await createFixture({ db });
});
beforeEach(async () => {
  if (!f) return;
  await f.reset();
  for (const model of ['loginProof', 'identitySession', 'checkoutOwnership', 'identityRateLimit', 'subscription', 'user']) await db[model].deleteMany({});
  await db.user.createMany({ data: [
    { id: 1, email: 'a@example.invalid', stripeId: 'cus_test_a', firstName: 'A', lastName: 'Test', isAdmin: false, subscriptionActive: 'active' },
    { id: 2, email: 'b@example.invalid', stripeId: 'cus_test_b', firstName: 'B', lastName: 'Test', isAdmin: false },
  ] });
});
after(async () => {
  if (f) await f.close();
  if (db) await db.$disconnect();
  if (admin) {
    if (schema) await admin.$executeRawUnsafe('DROP SCHEMA IF EXISTS "' + schema + '" CASCADE');
    await admin.$disconnect();
  }
});
async function issue() {
  assert.equal((await f.json('auth/login', { email: 'a@example.invalid' })).status, 202);
  return new URL(f.mail.at(-1).link).hash.slice(7);
}
test('real PostgreSQL: 24 concurrent exchanges, one session and one consumed proof', async () => {
  const token = await issue();
  const results = await Promise.all(Array.from({ length: 24 }, () => f.json('auth/verify', { token })));
  assert.equal(results.filter(r => r.status === 200).length, 1);
  assert.equal(results.filter(r => r.status === 401).length, 23);
  assert.equal(await db.identitySession.count(), 1);
  assert.equal(await db.loginProof.count({ where: { consumedAt: { not: null } } }), 1);
  const secondConnection = new PrismaClient({ datasources: { db: { url: url.href } } });
  try {
    assert.equal(await secondConnection.identitySession.count(), 1, 'session persists outside the creating client');
  } finally { await secondConnection.$disconnect(); }
});
test('real PostgreSQL: failed session insert rolls back consumption', async () => {
  const token = await issue();
  await db.$executeRawUnsafe('ALTER TABLE "' + schema + '"."IdentitySession" ADD CONSTRAINT synthetic_failure CHECK (false)');
  try { assert.equal((await f.json('auth/verify', { token })).status, 500); }
  finally { await db.$executeRawUnsafe('ALTER TABLE "' + schema + '"."IdentitySession" DROP CONSTRAINT synthetic_failure'); }
  assert.equal(await db.loginProof.count({ where: { consumedAt: null } }), 1);
  assert.equal((await f.json('auth/verify', { token })).status, 200);
});
test('real PostgreSQL: expiry, current identity, logout and cascade revocation', async () => {
  const token = await issue();
  f.advance(900000);
  assert.equal((await f.json('auth/verify', { token })).status, 401);
  const cookie = await f.login();
  const get = () => f.request('auth/session', { headers: { Cookie: cookie } });
  assert.equal((await get()).status, 200);
  assert.equal((await f.json('auth/logout', {}, cookie)).status, 204);
  assert.equal((await get()).status, 401);
  const fresh = await f.login();
  f.advance(7 * 86400000);
  assert.equal((await f.request('auth/session', { headers: { Cookie: fresh } })).status, 401);
  await db.user.delete({ where: { id: 1 } });
  assert.equal(await db.identitySession.count(), 0);
  assert.equal(await db.loginProof.count(), 0);
});
test('real PostgreSQL: concurrent login limits are atomic', async () => {
  const responses = await Promise.all(Array.from({ length: 12 }, () => f.json('auth/login', { email: 'unknown@example.invalid' })));
  assert.equal(responses.filter(r => r.status === 202).length, 5);
  assert.equal(responses.filter(r => r.status === 429).length, 7);
  assert.equal(f.mail.length, 0);
});
test('real PostgreSQL: checkout ownership persists and cross-account lookup never calls Stripe', async () => {
  const cookieA = await f.login();
  const checkout = await f.request('payment/checkout-session/synthetic-public-key/cus_test_a', { headers: { Cookie: cookieA, 'X-RVDL-CSRF': '1' } });
  assert.equal(checkout.status, 200);
  assert.equal(await db.checkoutOwnership.count({ where: { userId: 1, sessionId: checkout.body.id } }), 1);
  const cookieB = await f.login('b@example.invalid'); f.calls.length = 0;
  assert.equal((await f.json('payment/checkout-session-object/synthetic-public-key', { sessionId: checkout.body.id }, cookieB)).status, 403);
  assert.equal(f.calls.some(call => call.startsWith('stripe.')), false);
  assert.equal((await f.json('payment/checkout-session-object/synthetic-public-key', { sessionId: checkout.body.id }, cookieA)).status, 200);
});
test('real PostgreSQL: migration replay is idempotent', () => {
  assert.equal(cli(['migrate', 'deploy']).status, 0);
});
// A strict, separately invoked assessment. It found an existing telemetry-model
// mismatch, outside identity scope; preserve the failing assertion as evidence.
if (process.env.RVDL_ASSESS_FULL_SCHEMA === '1') test('full schema assessment: migration output matches Prisma', () => {
  const diff = cli(['migrate', 'diff', '--from-url', url.href, '--to-schema-datamodel', 'prisma/schema.prisma', '--exit-code']);
  assert.equal(diff.status, 0, 'migration output must have no schema drift: ' + diff.stdout);
});
