// Real PostgreSQL and independent Prisma clients; Stripe/mail/media stay fake.
const assert = require('node:assert/strict');
const { test, before, beforeEach, after } = require('node:test');
const { PrismaClient } = require('@prisma/client');
const { randomUUID } = require('node:crypto');
const { spawnSync } = require('node:child_process');
const { createPaidAccess, MAX_FRESHNESS_MS } = require('../../billing/paid-access');
const { config } = require('../support/billing-provider');
const {
  paidAccessCases,
  reads,
  cancellation,
  postEvent,
  pauseInvoice,
} = require('../support/paid-access-cases');
let db, admin, f, schema, url;

before(async () => {
  let candidate;
  try {
    candidate = new URL(process.env.TEST_DATABASE_URL);
  } catch {
    throw Error('Dedicated disposable TEST_DATABASE_URL required');
  }
  if (
    !['postgres:', 'postgresql:'].includes(candidate.protocol) ||
    !['localhost', '127.0.0.1', '[::1]'].includes(candidate.hostname) ||
    candidate.pathname !== '/rvdl_identity_test' ||
    [...candidate.searchParams.keys()].some((key) => key !== 'connection_limit')
  )
    throw Error('Refusing non-disposable database');
  admin = new PrismaClient({ datasources: { db: { url: candidate.href } } });
  schema = 'paid_access_test_' + randomUUID().replaceAll('-', '');
  await admin.$executeRawUnsafe(`CREATE SCHEMA "${schema}"`);
  url = candidate;
  url.searchParams.set('schema', schema);
  const migrated = spawnSync(process.execPath, ['node_modules/prisma/build/index.js', 'migrate', 'deploy'], {
    cwd: require('node:path').resolve(__dirname, '../..'),
    encoding: 'utf8',
    timeout: 60000,
    env: { ...process.env, DATABASE_URL: url.href, HEROKU_POSTGRESQL_BROWN_URL: url.href },
  });
  assert.equal(migrated.status, 0, 'full forward migration replay in fresh schema');
  db = new PrismaClient({ datasources: { db: { url: url.href } } });
  f = await require('../support/paid-access-http')({ db });
  await db.artist.create({ data: { id: 1, name: 'Synthetic artist' } });
  await db.raga.create({ data: { id: 1, name: 'Synthetic raga' } });
  await db.mediaType.create({ data: { id: 1, name: 'Synthetic audio' } });
  await db.category.create({ data: { id: 1, name: 'Synthetic event' } });
  await db.location.create({ data: { id: 1, name: 'Synthetic location' } });
  await db.event.create({
    data: { id: 1, eventName: 'Synthetic', date: '2026-10-17', locationId: 1, categoryId: 1 },
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
});
beforeEach(async () => {
  if (!f) return;
  await f.reset();
  for (const model of [
    'billingOperation',
    'billingCustomer',
    'loginProof',
    'identitySession',
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
      },
      {
        id: 2,
        email: 'b@example.invalid',
        firstName: 'B',
        lastName: 'Test',
        stripeId: 'cus_test_b',
        isAdmin: false,
      },
    ],
  });
  await db.billingCustomer.createMany({
    data: [
      { customerId: 'cus_test_a', userId: 1, livemode: false },
      { customerId: 'cus_test_b', userId: 2, livemode: false },
    ],
  });
  await f.select();
});
after(async () => {
  if (f) await f.close();
  if (db) await db.$disconnect();
  if (admin) {
    if (schema) await admin.$executeRawUnsafe(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
    await admin.$disconnect();
  }
});
paidAccessCases({ test, fixture: () => f });

async function independent(work) {
  const other = new PrismaClient({ datasources: { db: { url: url.href } } });
  const access = createPaidAccess({ db: other, stripe: f.stripe, config, now: f.clock });
  try {
    return await work(other, access);
  } finally {
    await other.$disconnect();
  }
}

test('PostgreSQL: a second client/adapter reuses shared cache with zero extra GETs', async () => {
  f.stripe.paidInvoice();
  await f.access().readEntitlement(1);
  f.calls.length = 0;
  await independent(async (_other, access) => {
    assert.equal((await access.readEntitlement(1)).kind, 'paid');
  });
  assert.deepEqual(reads(f), []);
});

for (const action of ['cancellation', 'deletion', 'selection replacement']) {
  test('PostgreSQL: independent ' + action + ' defeats a suspended HTTP fill', async () => {
    const p = f.stripe.paidInvoice(),
      cookie = await f.login(),
      gate = pauseInvoice(f);
    const pending = f.play(cookie);
    try {
      await gate.arrived;
      await independent(async (other, access) => {
        if (action === 'cancellation') await access.processEvent(cancellation(p.sub));
        if (action === 'deletion') await other.user.delete({ where: { id: 1 } });
        if (action === 'selection replacement')
          await other.billingCustomer.update({
            where: { customerId: 'cus_test_a' },
            data: { selectedSubscriptionId: 'sub_replacement' },
          });
      });
      gate.release();
      assert.equal((await pending).status, 403);
      assert.equal(f.signatures.length, 0);
      assert.equal((await f.binding()).accessFreshUntil, null);
      if (action === 'deletion') assert.equal(await db.identitySession.count(), 0);
    } finally {
      gate.release();
      gate.restore();
      await pending;
    }
  });
}

test('PostgreSQL: newer denied snapshot wins over an older positive in-flight result', async () => {
  const p = f.stripe.paidInvoice(),
    gate = pauseInvoice(f);
  const old = f.access().readEntitlement(1);
  try {
    await gate.arrived;
    gate.restore();
    f.advance(1);
    p.invoice.paid_out_of_band = true;
    await independent(async (_other, access) => {
      assert.equal(await access.readEntitlement(1), null);
    });
    const newer = await f.binding();
    gate.release();
    assert.equal(await old, null);
    const after = await f.binding();
    assert.equal(after.accessCheckedAt.getTime(), newer.accessCheckedAt.getTime());
    assert.equal(after.accessFreshUntil, null);
  } finally {
    gate.release();
    gate.restore();
    await old;
  }
});

test('PostgreSQL: newer qualifying provider period wins over an older qualifying fill', async () => {
  const p = f.stripe.paidInvoice(),
    gate = pauseInvoice(f);
  const old = f.access().readEntitlement(1);
  try {
    await gate.arrived;
    gate.restore();
    f.advance(1);
    p.line.period.end -= 3600;
    await independent(async (_other, access) => {
      await access.readEntitlement(1);
    });
    const newer = await f.binding();
    gate.release();
    assert.equal((await old).paidThrough.getTime(), newer.cachedPaidThrough.getTime());
    assert.equal((await f.binding()).accessCheckedAt.getTime(), newer.accessCheckedAt.getTime());
  } finally {
    gate.release();
    gate.restore();
    await old;
  }
});

test('PostgreSQL: cancellation persistence failure cannot acknowledge; retry installs terminal veto', async () => {
  const p = f.stripe.paidInvoice();
  await f.access().readEntitlement(1);
  await db.$executeRawUnsafe(
    `ALTER TABLE "${schema}"."BillingCustomer" ADD CONSTRAINT synthetic_cancel_failure CHECK ("selectedCanceledAt" IS NULL) NOT VALID`
  );
  try {
    assert.equal((await postEvent(f, cancellation(p.sub))).status, 500);
    assert.equal((await f.binding()).selectedCanceledAt, null);
  } finally {
    await db.$executeRawUnsafe(
      `ALTER TABLE "${schema}"."BillingCustomer" DROP CONSTRAINT synthetic_cancel_failure`
    );
  }
  assert.equal((await postEvent(f, cancellation(p.sub))).status, 200);
  assert.equal(await f.access().readEntitlement(1), null);
});

test('PostgreSQL: failed cache write cannot sign or leave a partial snapshot', async () => {
  f.stripe.paidInvoice();
  const cookie = await f.login();
  await db.$executeRawUnsafe(
    `ALTER TABLE "${schema}"."BillingCustomer" ADD CONSTRAINT synthetic_cache_failure CHECK ("accessCheckedAt" IS NULL) NOT VALID`
  );
  try {
    assert.equal((await f.play(cookie)).status, 503);
    const row = await f.binding();
    assert.equal(row.accessFreshUntil, null);
    assert.equal(row.accessCheckedAt, null);
    assert.equal(f.signatures.length, 0);
  } finally {
    await db.$executeRawUnsafe(
      `ALTER TABLE "${schema}"."BillingCustomer" DROP CONSTRAINT synthetic_cache_failure`
    );
  }
});

test('PostgreSQL: unique selection and finite/coherent freshness constraints enforce cache bounds', async () => {
  f.stripe.paidInvoice();
  await f.access().readEntitlement(1);
  const row = await f.binding();
  await assert.rejects(
    db.billingCustomer.update({
      where: { customerId: 'cus_test_b' },
      data: { selectedSubscriptionId: 'sub_test_a' },
    })
  );
  for (const data of [
    { accessFreshUntil: new Date(row.accessCheckedAt.getTime() + MAX_FRESHNESS_MS + 1) },
    { cachedPaidThrough: row.cachedPaidFrom },
    { selectedCanceledAt: f.clock() },
    { cachedPaidFrom: null },
    { accessPolicyKey: null },
  ])
    await assert.rejects(db.billingCustomer.update({ where: { customerId: 'cus_test_a' }, data }));
});
