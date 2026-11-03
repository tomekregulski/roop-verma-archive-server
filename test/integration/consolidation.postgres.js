// Real prior-schema upgrades, only in fresh, dedicated loopback PostgreSQL.
const assert = require('node:assert/strict');
const { test, before, after } = require('node:test');
const { PrismaClient } = require('@prisma/client');
const { randomUUID } = require('node:crypto');
const { spawnSync } = require('node:child_process');
const fs = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');
const removal = '20261102120000_c1_billing_consolidation';
let admin, source, directory;
function cli(url, schema) {
  return spawnSync(
    process.execPath,
    [
      'node_modules/prisma/build/index.js',
      'migrate',
      'deploy',
      ...(schema ? ['--schema', schema] : []),
    ],
    {
      cwd: path.resolve(__dirname, '../..'),
      encoding: 'utf8',
      timeout: 60000,
      env: { ...process.env, DATABASE_URL: url, HEROKU_POSTGRESQL_BROWN_URL: url },
    }
  );
}
before(async () => {
  source = new URL(process.env.TEST_DATABASE_URL);
  if (
    !['postgres:', 'postgresql:'].includes(source.protocol) ||
    !['127.0.0.1', 'localhost', '[::1]'].includes(source.hostname) ||
    source.pathname !== '/rvdl_identity_test' ||
    [...source.searchParams.keys()].some((k) => k !== 'connection_limit')
  )
    throw Error('Refusing non-disposable database');
  admin = new PrismaClient({ datasources: { db: { url: source.href } } });
  directory = await fs.mkdtemp(path.join(os.tmpdir(), 'rvdl-c1-upgrade-'));
  await fs.copyFile('prisma/schema.prisma', path.join(directory, 'schema.prisma'));
  await fs.mkdir(path.join(directory, 'migrations'));
  for (const name of await fs.readdir('prisma/migrations'))
    if (name !== removal)
      await fs.cp(path.join('prisma/migrations', name), path.join(directory, 'migrations', name), {
        recursive: true,
      });
});
after(async () => {
  if (admin) await admin.$disconnect();
  if (directory) await fs.rm(directory, { recursive: true, force: true });
});
async function prior(work) {
  const schema = 'c1_upgrade_' + randomUUID().replaceAll('-', '');
  await admin.$executeRawUnsafe(`CREATE SCHEMA "${schema}"`);
  const url = new URL(source);
  url.searchParams.set('schema', schema);
  const db = new PrismaClient({ datasources: { db: { url: url.href } } });
  try {
    assert.equal(
      cli(url.href, path.join(directory, 'schema.prisma')).status,
      0,
      'prior migration replay'
    );
    return await work(db, () => cli(url.href));
  } finally {
    await db.$disconnect();
    await admin.$executeRawUnsafe(`DROP SCHEMA "${schema}" CASCADE`);
  }
}
async function identity(db, stripeId = null) {
  const [u] =
    await db.$queryRaw`INSERT INTO "User" (email,"firstName","lastName","stripeId","isAdmin","deletionRevision") VALUES ('upgrade@example.invalid','Synthetic','Upgrade',${stripeId},false,0) RETURNING id`;
  if (stripeId)
    await db.$executeRaw`INSERT INTO "BillingCustomer" ("customerId","userId",livemode,"selectedSubscriptionId") VALUES (${stripeId},${u.id},false,'sub_upgrade')`;
  return u;
}
async function attempt(db, userId, parameters, kind = 'checkout') {
  parameters ||= {
    version: 2,
    livemode: false,
    previousSelection: 'sub_upgrade',
    request: {
      mode: 'subscription',
      customer: 'cus_upgrade',
      line_items: [{ price: 'price_test_monthly', quantity: 1 }],
      payment_method_types: ['card'],
      metadata: { billing_operation: 'upgrade' },
      client_reference_id: 'upgrade',
      success_url:
        'https://client.example.invalid/complete-registration?success=true&session_id={CHECKOUT_SESSION_ID}',
      cancel_url: 'https://client.example.invalid/manage-account',
    },
  };
  const digest = require('../../billing/purchase').digest(parameters);
  await db.$executeRaw`INSERT INTO "BillingOperation" (id,"activeKey",kind,"userId","customerId",digest,parameters,"externalId") VALUES ('upgrade',${
    'purchase:user:' + userId
  },${kind},${userId},'cus_upgrade',${digest},${JSON.stringify(parameters)}::jsonb,'cs_upgrade')`;
}
async function subscription(db, userId) {
  await db.$executeRaw`INSERT INTO "Subscription" (id,name,"userId","stripeId","priceId","productId",status) VALUES ('sub_upgrade','Synthetic',${userId},'cus_upgrade','price_test_monthly','prod_test_archive','active')`;
}
async function refuses(db, deploy, reason) {
  const migration = await fs.readFile(
    path.join('prisma/migrations', removal, 'migration.sql'),
    'utf8'
  );
  const guard = migration.slice(
    migration.indexOf('DO $$ BEGIN'),
    migration.indexOf('END $$;') + 'END $$;'.length
  );
  await assert.rejects(
    db.$executeRawUnsafe(guard),
    (error) => reason.test(error.message),
    'specific preflight guard must fail before destructive statements'
  );
  const result = deploy();
  assert.notEqual(result.status, 0, 'nonempty/unsupported prior data must stop migration');
  const tables =
    await db.$queryRaw`SELECT tablename FROM pg_tables WHERE schemaname=current_schema()`;
  for (const name of [
    'PaidInvoiceGrant',
    'Subscription',
    'StripeEventReceipt',
    'CheckoutOwnership',
    'WebhookLog',
  ])
    assert.ok(
      tables.some((t) => t.tablename === name),
      name + ' must survive transaction rollback'
    );
  assert.equal(
    (
      await db.$queryRaw`SELECT count(*)::int AS n FROM "_prisma_migrations" WHERE migration_name=${removal} AND finished_at IS NOT NULL`
    )[0].n,
    0
  );
}
test('C1 upgrade preserves populated identities, proof/session ownership, immutable attempts, cache/veto and deletion tombstones', async () =>
  prior(async (db, deploy) => {
    const u = await identity(db, 'cus_upgrade');
    await attempt(db, u.id);
    await db.$executeRaw`UPDATE "BillingCustomer" SET "cachedPaidFrom"='2026-10-17',"cachedPaidThrough"='2026-10-18',"accessCheckedAt"='2026-10-17',"accessFreshUntil"='2026-10-17 00:15',"accessPolicyKey"='synthetic'`;
    await db.$executeRaw`UPDATE "User" SET "deletionRequestedAt"='2026-10-17',"deletionRevision"=3,"deletionNotice"='uncertain'`;
    await db.$executeRaw`INSERT INTO "BillingCustomer" ("customerId",livemode,"deletedAt","stripeDeletedAt","selectedSubscriptionId","selectedCanceledAt") VALUES ('cus_deleted',false,'2026-10-16','2026-10-16','sub_deleted','2026-10-16')`;
    await db.$executeRaw`INSERT INTO "BillingOperation" (id,kind,digest,parameters,"deletedAt","closureCustomerId","closureSubscriptionId") VALUES ('deleted','checkout','','{}','2026-10-16','cus_deleted','sub_deleted')`;
    await db.$executeRaw`INSERT INTO "IdentitySession" ("tokenHash","userId",email,"expiresAt") VALUES ('synthetic-session',${u.id},'upgrade@example.invalid','2026-12-01')`;
    await db.$executeRaw`INSERT INTO "LoginProof" ("tokenHash","userId",email,"expiresAt") VALUES ('synthetic-proof',${u.id},'upgrade@example.invalid','2026-12-01')`;
    const before = await db.billingCustomer.findMany({ orderBy: { customerId: 'asc' } });
    const ops = await db.billingOperation.findMany({ orderBy: { id: 'asc' } });
    assert.equal(deploy().status, 0);
    const config = require('../support/billing-provider').config;
    const purchase = require('../../billing/purchase').createPurchase({
      db,
      stripe: {},
      config,
      clientOrigin: 'https://client.example.invalid',
      access: {},
    });
    assert.doesNotThrow(
      () => purchase.deletionChecks.trusted(ops.find((op) => op.id === 'upgrade')),
      'retained attempt still validates as immutable purchase evidence'
    );
    assert.deepEqual(await db.billingCustomer.findMany({ orderBy: { customerId: 'asc' } }), before);
    assert.deepEqual(await db.billingOperation.findMany({ orderBy: { id: 'asc' } }), ops);
    assert.equal((await db.user.findUnique({ where: { id: u.id } })).deletionRevision, 3);
    assert.equal(await db.identitySession.count(), 1);
    assert.equal(await db.loginProof.count(), 1);
    assert.equal(deploy().status, 0, 'migration replay is idempotent');
    const tables =
      await db.$queryRaw`SELECT tablename FROM pg_tables WHERE schemaname=current_schema()`;
    for (const name of [
      'PaidInvoiceGrant',
      'Subscription',
      'StripeEventReceipt',
      'CheckoutOwnership',
      'WebhookLog',
    ])
      assert.equal(
        tables.some((t) => t.tablename === name),
        false
      );
  }));
for (const matched of [false, true])
  test('C1 refuses populated legacy CheckoutOwnership, matched attempt=' + matched, async () =>
    prior(async (db, deploy) => {
      const u = await identity(db, 'cus_upgrade');
      if (matched) await attempt(db, u.id);
      await db.$executeRaw`INSERT INTO "CheckoutOwnership" ("sessionId","userId","customerId") VALUES ('cs_upgrade',${u.id},'cus_upgrade')`;
      await refuses(db, deploy, /legacy Checkout ownership/);
      assert.equal(
        (await db.$queryRaw`SELECT count(*)::int AS n FROM "CheckoutOwnership"`)[0].n,
        1,
        'D9 unresolved evidence must not disappear'
      );
    })
  );
for (const grants of [false, true])
  test(
    'C1 refuses historical subscriptions and grants without retention disposition, grants=' +
      grants,
    async () =>
      prior(async (db, deploy) => {
        const u = await identity(db, 'cus_upgrade');
        await subscription(db, u.id);
        if (grants)
          await db.$executeRaw`INSERT INTO "PaidInvoiceGrant" ("invoiceId","invoiceLineId","subscriptionId","priceId","serviceFrom","serviceThrough","settledAt","paymentIntentId","chargeId",currency,"amountPaid","verifiedAt") VALUES ('in_upgrade','il_upgrade','sub_upgrade','price_test_monthly','2026-10-17','2026-11-17','2026-10-17','pi_upgrade','ch_upgrade','usd',1000,'2026-10-17')`;
        await refuses(db, deploy, /owner retention disposition/);
        assert.equal((await db.$queryRaw`SELECT count(*)::int AS n FROM "Subscription"`)[0].n, 1);
        assert.equal(
          (await db.$queryRaw`SELECT count(*)::int AS n FROM "PaidInvoiceGrant"`)[0].n,
          grants ? 1 : 0
        );
      })
  );
for (const outcome of ['pending', 'applied', 'ignored', 'review'])
  test('C1 refuses event receipt retention, outcome=' + outcome, async () =>
    prior(async (db, deploy) => {
      await db.$executeRaw`INSERT INTO "StripeEventReceipt" ("eventId",type,"objectId",outcome) VALUES ('evt_upgrade','invoice.paid','in_upgrade',${outcome})`;
      await refuses(db, deploy, /owner retention disposition/);
      assert.equal(
        (await db.$queryRaw`SELECT outcome FROM "StripeEventReceipt"`)[0].outcome,
        outcome
      );
    })
  );
test('C1 refuses historical webhook log retention', async () =>
  prior(async (db, deploy) => {
    await db.$executeRaw`INSERT INTO "WebhookLog" ("requestId","idempotencyKey",type) VALUES ('synthetic','synthetic','synthetic')`;
    await refuses(db, deploy, /owner retention disposition/);
    assert.equal((await db.$queryRaw`SELECT count(*)::int AS n FROM "WebhookLog"`)[0].n, 1);
  }));
for (const kind of ['registration', 'checkout', 'orphan'])
  test(
    'C1 refuses unsupported/orphan attempts without rewriting immutable parameters: ' + kind,
    async () =>
      prior(async (db, deploy) => {
        const u = await identity(db);
        const parameters =
          kind === 'orphan'
            ? { version: 2 }
            : { email: 'retained@example.invalid', firstName: 'Retained' };
        await attempt(
          db,
          kind === 'orphan' ? null : u.id,
          parameters,
          kind === 'registration' ? kind : 'checkout'
        );
        await refuses(db, deploy, /unsupported or orphan immutable attempts/);
        assert.deepEqual(
          (await db.$queryRaw`SELECT parameters FROM "BillingOperation"`)[0].parameters,
          parameters
        );
      })
  );
for (const column of ['deletionRequestedAt', 'syncIssueCode', 'reconcileCursor'])
  test('C1 refuses unresolved binding evidence: ' + column, async () =>
    prior(async (db, deploy) => {
      await identity(db, 'cus_upgrade');
      const value = column === 'deletionRequestedAt' ? "'2026-10-17'" : "'synthetic-unresolved'";
      await db.$executeRawUnsafe(`UPDATE "BillingCustomer" SET "${column}"=${value}`);
      await refuses(db, deploy, /unresolved legacy deletion\/synchronization evidence/);
    })
  );
for (const mismatch of [false, true])
  test(
    'C1 refuses missing/foreign trusted selection instead of inventing backfill: mismatch=' +
      mismatch,
    async () =>
      prior(async (db, deploy) => {
        await identity(db, 'cus_upgrade');
        if (mismatch) await db.$executeRaw`UPDATE "User" SET "stripeId"='cus_foreign'`;
        else await db.$executeRaw`UPDATE "BillingCustomer" SET "selectedSubscriptionId"=NULL`;
        await refuses(db, deploy, /trusted selection\/ownership preflight/);
        assert.equal((await db.$queryRaw`SELECT count(*)::int AS n FROM "User"`)[0].n, 1);
      })
  );
