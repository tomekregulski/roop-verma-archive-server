// Same HTTP lifecycle cases as the synthetic suite, now with actual PostgreSQL.
const assert = require('node:assert/strict');
const { test, before, beforeEach, after } = require('node:test');
const { PrismaClient } = require('@prisma/client');
const { randomUUID } = require('node:crypto');
const { spawnSync } = require('node:child_process');
const fs = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');
let db, admin, f, schema, url, upgradeDirectory;
const schemas = [];
function cli(args, target = url, schemaPath) {
  return spawnSync(
    process.execPath,
    ['node_modules/prisma/build/index.js', ...args, ...(schemaPath ? ['--schema', schemaPath] : [])],
    {
      cwd: path.resolve(__dirname, '../..'),
      encoding: 'utf8',
      timeout: 60000,
      env: { ...process.env, DATABASE_URL: target.href, HEROKU_POSTGRESQL_BROWN_URL: target.href },
    }
  );
}
async function newSchema() {
  const name = 'billing_test_' + randomUUID().replaceAll('-', '');
  schemas.push(name);
  await admin.$executeRawUnsafe(`CREATE SCHEMA "${name}"`);
  const target = new URL(url);
  target.searchParams.set('schema', name);
  return { name, target };
}
before(async () => {
  try {
    url = new URL(process.env.TEST_DATABASE_URL);
  } catch {
    throw new Error('Dedicated disposable TEST_DATABASE_URL required');
  }
  if (
    !['postgres:', 'postgresql:'].includes(url.protocol) ||
    !['localhost', '127.0.0.1', '[::1]'].includes(url.hostname) ||
    url.pathname !== '/rvdl_identity_test' ||
    [...url.searchParams.keys()].some((k) => k !== 'connection_limit')
  )
    throw new Error('Refusing a non-disposable database');
  admin = new PrismaClient({ datasources: { db: { url: url.href } } });
  const created = await newSchema();
  schema = created.name;
  url = created.target;
  assert.equal(cli(['migrate', 'deploy']).status, 0, 'fresh migration history replay');
  db = new PrismaClient({ datasources: { db: { url: url.href } } });
  f = await require('../support/billing-http')({ db });
  // Real catalog records, no legacy URL is ever used by playback.
  await db.artist.create({ data: { id: 1, name: 'Synthetic artist' } });
  await db.raga.create({ data: { id: 1, name: 'Synthetic raga' } });
  await db.mediaType.create({ data: { id: 1, name: 'Synthetic audio' } });
  await db.category.create({ data: { id: 1, name: 'Synthetic event' } });
  await db.location.create({ data: { id: 1, name: 'Synthetic location' } });
  await db.event.create({
    data: { id: 1, eventName: 'Synthetic event', date: '2026-10-17', locationId: 1, categoryId: 1 },
  });
  await db.tape.create({ data: { id: 1, tapeId: 1, eventId: 1 } });
  for (const id of [10, 20])
    await db.track.create({
      data: {
        id,
        trackId: id,
        tapeId: 1,
        ragaId: 1,
        primaryArtistId: 1,
        mediaTypeId: 1,
        public: id === 10,
        url: 'https://legacy.example.invalid/unused.mp3',
        master: false,
        alap: false,
        jor: false,
        jhalla: false,
        slowGat: false,
        mediumGat: false,
        fastGat: false,
        accompanied: false,
      },
    });
  upgradeDirectory = await fs.mkdtemp(path.join(os.tmpdir(), 'rvdl-billing-upgrade-'));
  await fs.copyFile(path.resolve('prisma/schema.prisma'), path.join(upgradeDirectory, 'schema.prisma'));
  await fs.mkdir(path.join(upgradeDirectory, 'migrations'));
  for (const name of await fs.readdir('prisma/migrations'))
    if (!['20261101120000_billing_evidence', '20261101180000_paid_access_cache', '20261101200000_owned_checkout'].includes(name))
      await fs.cp(path.join('prisma/migrations', name), path.join(upgradeDirectory, 'migrations', name), {
        recursive: true,
      });
});
beforeEach(async () => {
  if (!f) return;
  await f.reset();
  for (const model of [
    'paidInvoiceGrant',
    'stripeEventReceipt',
    'billingOperation',
    'subscription',
    'billingCustomer',
    'loginProof',
    'identitySession',
    'checkoutOwnership',
    'identityRateLimit',
    'user',
  ])
    await db[model].deleteMany({});
  await db.user.createMany({
    data: [
      {
        id: 1,
        email: 'a@example.invalid',
        firstName: 'A',
        lastName: 'Test',
        stripeId: 'cus_test_a',
        isAdmin: false,
        subscriptionActive: 'active',
      },
      {
        id: 2,
        email: 'b@example.invalid',
        firstName: 'B',
        lastName: 'Test',
        stripeId: 'cus_test_b',
        isAdmin: false,
      },
      {
        id: 3,
        email: 'admin@example.invalid',
        firstName: 'Admin',
        lastName: 'Test',
        stripeId: 'cus_test_admin',
        isAdmin: true,
      },
    ],
  });
  // Explicit fixture IDs above do not advance the database sequence.
  await db.$executeRawUnsafe(`SELECT setval(pg_get_serial_sequence('"${schema}"."User"', 'id'), 3, true)`);
  await db.billingCustomer.createMany({
    data: [1, 2, 3].map((userId, i) => ({
      userId,
      customerId: ['cus_test_a', 'cus_test_b', 'cus_test_admin'][i],
      livemode: false,
    })),
  });
});
after(async () => {
  if (f) await f.close();
  if (db) await db.$disconnect();
  if (admin) {
    for (const name of schemas) await admin.$executeRawUnsafe(`DROP SCHEMA IF EXISTS "${name}" CASCADE`);
    await admin.$disconnect();
  }
  if (upgradeDirectory) await fs.rm(upgradeDirectory, { recursive: true, force: true });
});
require('../support/billing-cases')({ test, fixture: () => f });
test('PostgreSQL independently connected synchronizers persist exactly one invoice grant', async () => {
  const { createBilling } = require('../../billing/service');
  const other = new PrismaClient({ datasources: { db: { url: url.href } } });
  const p = f.stripe.paidInvoice();
  const second = createBilling({
    db: other,
    stripe: f.stripe,
    config: f.stripe.config,
    now: () => new Date('2026-10-17T16:00:00Z'),
  });
  try {
    await Promise.all([
      f.billing.sync('cus_test_a', { invoiceIds: [p.invoice.id] }),
      second.sync('cus_test_a', { invoiceIds: [p.invoice.id] }),
    ]);
    assert.equal(await other.paidInvoiceGrant.count(), 1);
    assert.equal(
      (await other.billingCustomer.findUnique({ where: { customerId: 'cus_test_a' } })).revision,
      2
    );
  } finally {
    await other.$disconnect();
  }
});
test('PostgreSQL grant/receipt commit failure rolls back revision and all projections, then reconciliation repairs', async () => {
  const { webhooks } = require('stripe');
  const { event } = require('../support/billing-provider');
  const p = f.stripe.paidInvoice(),
    body = JSON.stringify(event('invoice.paid', p.invoice.id, 'evt_sql_rollback'));
  const post = () =>
    f.request('payment/webhooks', {
      method: 'POST',
      body,
      headers: {
        'Content-Type': 'application/json',
        'Stripe-Signature': webhooks.generateTestHeaderString({
          payload: body,
          secret: 'whsec_synthetic_fixture_only',
        }),
      },
    });
  for (const table of ['PaidInvoiceGrant', 'Subscription', 'StripeEventReceipt']) {
    // NOT VALID permits the pending receipt insert; only applied-state writes fail.
    const expression = table === 'StripeEventReceipt' ? `outcome <> 'applied'` : 'false';
    await db.$executeRawUnsafe(
      `ALTER TABLE "${schema}"."${table}" ADD CONSTRAINT synthetic_write_failure CHECK (${expression}) NOT VALID`
    );
    try {
      assert.equal((await post()).status, 503);
    } finally {
      await db.$executeRawUnsafe(
        `ALTER TABLE "${schema}"."${table}" DROP CONSTRAINT synthetic_write_failure`
      );
    }
    assert.equal(await db.paidInvoiceGrant.count(), 0);
    assert.equal(await db.subscription.count(), 0);
    assert.equal((await db.billingCustomer.findUnique({ where: { customerId: 'cus_test_a' } })).revision, 0);
    assert.equal(
      (await db.stripeEventReceipt.findUnique({ where: { eventId: 'evt_sql_rollback' } })).outcome,
      'pending'
    );
  }
  assert.equal((await post()).status, 200);
  assert.equal(await db.paidInvoiceGrant.count(), 1);
});
test('PostgreSQL uniqueness, original-period CHECKs, foreign keys and retained tombstones enforce storage boundaries', async () => {
  const p = f.stripe.paidInvoice();
  await f.billing.sync('cus_test_a', { invoiceIds: [p.invoice.id] });
  const grant = await db.paidInvoiceGrant.findUnique({ where: { invoiceId: p.invoice.id } });
  await assert.rejects(db.paidInvoiceGrant.create({ data: grant }));
  await assert.rejects(
    db.paidInvoiceGrant.update({
      where: { invoiceId: grant.invoiceId },
      data: { serviceThrough: grant.serviceFrom },
    })
  );
  await assert.rejects(
    db.paidInvoiceGrant.update({ where: { invoiceId: grant.invoiceId }, data: { amountPaid: 0 } })
  );
  await assert.rejects(
    db.subscription.create({
      data: {
        id: 'sub_second_accepted',
        name: 'Synthetic duplicate',
        userId: 1,
        stripeId: 'cus_test_a',
        priceId: 'price_test_monthly',
        productId: 'prod_test_archive',
        status: 'active',
        acceptedAt: new Date(),
      },
    })
  );
  await assert.rejects(db.subscription.delete({ where: { id: p.sub.id } }));
  await assert.rejects(db.billingCustomer.delete({ where: { customerId: 'cus_test_a' } }));
  await assert.rejects(
    db.stripeEventReceipt.create({
      data: { eventId: 'evt_bad', type: 'test', objectId: 'in_test', outcome: 'false-success' },
    })
  );
  await db.user.delete({ where: { id: 1 } });
  assert.equal((await db.subscription.findUnique({ where: { id: p.sub.id } })).userId, null);
  assert.equal((await db.billingCustomer.findUnique({ where: { customerId: 'cus_test_a' } })).userId, null);
  assert.equal(await db.paidInvoiceGrant.count(), 1);
});
test('offline reconciliation CLI inspects then applies the real persistence path idempotently', async () => {
  const fixturePath = path.join(upgradeDirectory, 'provider.cjs');
  const providerPath = path.resolve('test/support/billing-provider.js');
  await fs.writeFile(
    fixturePath,
    `const p = require(${JSON.stringify(providerPath)}).provider(); p.paidInvoice(); module.exports = p;`
  );
  const run = (apply) =>
    spawnSync(
      process.execPath,
      [
        'scripts/reconcile-billing.js',
        '--fixture',
        fixturePath,
        '--customer',
        'cus_test_a',
        ...(apply ? ['--apply'] : []),
      ],
      {
        cwd: path.resolve(__dirname, '../..'),
        encoding: 'utf8',
        timeout: 30000,
        env: {
          ...process.env,
          BILLING_DATABASE_URL: url.href,
          BILLING_PRICE_ID: 'price_test_monthly',
          BILLING_PRODUCT_ID: 'prod_test_archive',
          BILLING_CURRENCY: 'usd',
          BILLING_LIVEMODE: 'false',
        },
      }
    );
  const inspection = run(false);
  assert.equal(inspection.status, 0);
  assert.equal(JSON.parse(inspection.stdout).qualifying, 1);
  assert.equal(await db.paidInvoiceGrant.count(), 0);
  for (let i = 0; i < 2; i++) {
    const applied = run(true);
    assert.equal(applied.status, 0);
    assert.equal(JSON.parse(applied.stdout).outcome, 'applied');
  }
  assert.equal(await db.paidInvoiceGrant.count(), 1);
});
test('migration upgrade retains representative legacy data without inventing payment evidence and redeploys idempotently', async () => {
  const { target } = await newSchema();
  assert.equal(cli(['migrate', 'deploy'], target, path.join(upgradeDirectory, 'schema.prisma')).status, 0);
  const legacy = new PrismaClient({ datasources: { db: { url: target.href } } });
  try {
    const user = await legacy.user.create({
      select: { id: true },
      data: {
        email: 'legacy@example.invalid',
        firstName: 'Old',
        lastName: 'Listener',
        stripeId: 'cus_legacy',
        isAdmin: false,
        subscriptionActive: 'active',
      },
    });
    // Raw insert targets exactly the prior schema, where new fields do not exist.
    await legacy.$executeRaw`INSERT INTO "Subscription" (id, name, "userId", "stripeId", "priceId", "productId", status, "cancelAt") VALUES ('sub_legacy','legacy',${user.id},'cus_legacy','1234567','123456','active','invalid legacy timestamp')`;
    assert.equal(cli(['migrate', 'deploy'], target).status, 0);
    const b = await legacy.billingCustomer.findUnique({ where: { customerId: 'cus_legacy' } });
    assert.equal(b.userId, user.id);
    assert.equal(b.livemode, null);
    assert.equal(b.selectedSubscriptionId, null);
    assert.equal(b.accessFreshUntil, null);
    assert.equal(await legacy.paidInvoiceGrant.count(), 0);
    assert.equal((await legacy.subscription.findUnique({ where: { id: 'sub_legacy' } })).acceptedAt, null);
    assert.equal(cli(['migrate', 'deploy'], target).status, 0);
  } finally {
    await legacy.$disconnect();
  }
});
test('migration refuses mismatched legacy customer association without guessing or destroying data', async () => {
  const { target } = await newSchema();
  assert.equal(cli(['migrate', 'deploy'], target, path.join(upgradeDirectory, 'schema.prisma')).status, 0);
  const legacy = new PrismaClient({ datasources: { db: { url: target.href } } });
  try {
    const user = await legacy.user.create({
      select: { id: true },
      data: {
        email: 'mismatch@example.invalid',
        firstName: 'Mismatch',
        lastName: 'Test',
        stripeId: 'cus_true',
        isAdmin: false,
      },
    });
    await legacy.$executeRaw`INSERT INTO "Subscription" (id, name, "userId", "stripeId", "priceId", "productId", status) VALUES ('sub_orphan','legacy',${user.id},'cus_foreign','123','456','active')`;
    assert.notEqual(cli(['migrate', 'deploy'], target).status, 0);
    assert.equal(await legacy.user.count(), 1);
  } finally {
    await legacy.$disconnect();
  }
});
test('migration/schema diagnostic retains only the separately tracked telemetry nullability mismatch', () => {
  const diff = cli([
    'migrate',
    'diff',
    '--from-url',
    url.href,
    '--to-schema-datamodel',
    'prisma/schema.prisma',
    '--exit-code',
  ]);
  assert.equal(diff.status, 2);
  assert.match(diff.stdout, /NetworkError/);
  assert.match(diff.stdout, /errorCode/);
  assert.doesNotMatch(
    diff.stdout,
    /BillingCustomer|Subscription|PaidInvoiceGrant|StripeEventReceipt|BillingOperation/
  );
});
