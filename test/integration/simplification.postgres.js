// Synthetic prior-schema fixtures in a new dedicated loopback cluster only.
const assert = require('node:assert/strict');
const { test, before, after } = require('node:test');
const { PrismaClient } = require('@prisma/client');
const { randomUUID } = require('node:crypto');
const { spawnSync } = require('node:child_process');
const fs = require('node:fs/promises');
const path = require('node:path');
const target = '20261107120000_bounded_simplification';
let source, admin, directory;
function deploy(url, schema) {
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
      env: {
        ...process.env,
        DATABASE_URL: url,
        HEROKU_POSTGRESQL_BROWN_URL: url,
      },
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
  directory = await fs.mkdtemp(
    path.join(require('node:os').tmpdir(), 'rvdl-simplification-upgrade-')
  );
  await fs.copyFile(
    'prisma/schema.prisma',
    path.join(directory, 'schema.prisma')
  );
  await fs.mkdir(path.join(directory, 'migrations'));
  for (const name of await fs.readdir('prisma/migrations'))
    if (name < target || name === 'migration_lock.toml')
      await fs.cp(
        path.join('prisma/migrations', name),
        path.join(directory, 'migrations', name),
        { recursive: true }
      );
});
after(async () => {
  if (admin) await admin.$disconnect();
  if (directory) await fs.rm(directory, { recursive: true, force: true });
});
async function prior(work) {
  const schema = 'simplification_' + randomUUID().replaceAll('-', '');
  await admin.$executeRawUnsafe(`CREATE SCHEMA "${schema}"`);
  const url = new URL(source);
  url.searchParams.set('schema', schema);
  const db = new PrismaClient({ datasources: { db: { url: url.href } } });
  try {
    assert.equal(
      deploy(url.href, path.join(directory, 'schema.prisma')).status,
      0
    );
    await work(db, () => deploy(url.href));
  } finally {
    await db.$disconnect();
    await admin.$executeRawUnsafe(`DROP SCHEMA "${schema}" CASCADE`);
  }
}
for (const table of ['TrackPlay', 'NetworkError'])
  test(
    'simplification refuses nonempty ' + table + ' and rolls back all removals',
    async () =>
      prior(async (db, upgrade) => {
        if (table === 'TrackPlay')
          await db.$executeRaw`INSERT INTO "TrackPlay" ("userId","trackId","secondsListened") VALUES (999,999,42)`;
        else
          await db.$executeRaw`INSERT INTO "NetworkError" ("errorCode","errorMessage","isRegisteredUser",timestamp) VALUES (503,'synthetic retained diagnostic',false,now())`;
        // Keep the known mismatch explicit until guarded removal succeeds.
        const [column] =
          await db.$queryRaw`SELECT is_nullable FROM information_schema.columns WHERE table_schema=current_schema() AND table_name='NetworkError' AND column_name='errorCode'`;
        assert.equal(
          column.is_nullable,
          'NO',
          'historical DB is required; old model was nullable'
        );
        const sql = await fs.readFile(
          path.join('prisma/migrations', target, 'migration.sql'),
          'utf8'
        );
        const guard = sql.slice(
          sql.indexOf('DO $$ BEGIN'),
          sql.indexOf('END $$;') + 7
        );
        await assert.rejects(db.$executeRawUnsafe(guard), (error) =>
          error.message.includes(table + ' contains records')
        );
        assert.notEqual(upgrade().status, 0);
        assert.equal(
          (
            await db.$queryRawUnsafe(
              `SELECT count(*)::int AS n FROM "${table}"`
            )
          )[0].n,
          1
        );
        const names =
          await db.$queryRaw`SELECT tablename FROM pg_tables WHERE schemaname=current_schema()`;
        for (const name of ['TrackPlay', 'NetworkError'])
          assert.ok(names.some((row) => row.tablename === name));
        assert.equal(
          (
            await db.$queryRaw`SELECT count(*)::int AS n FROM "_prisma_migrations" WHERE migration_name=${target} AND finished_at IS NOT NULL`
          )[0].n,
          0
        );
      })
  );
test('simplification preserves aggregate/catalog/media/tribute, pending state, authority and billing tombstones; replaces only derived cache', async () =>
  prior(async (db, upgrade) => {
    await db.$executeRaw`INSERT INTO "User" (email,"firstName","lastName","isAdmin","stripeId","deletionRequestedAt","deletionRevision","deletionNotice") VALUES ('owner@example.invalid','Synthetic','Owner',true,'cus_upgrade','2026-11-07',3,'uncertain')`;
    const [user] = await db.$queryRaw`SELECT id FROM "User"`;
    await db.$executeRaw`INSERT INTO "BillingCustomer" ("customerId","userId",livemode,"selectedSubscriptionId","accessCheckedAt","accessPolicyKey","cachedPaidFrom","cachedPaidThrough","accessFreshUntil") VALUES ('cus_upgrade',${user.id},false,'sub_upgrade','2026-11-07','old-invoice-policy','2026-11-01','2026-12-01','2026-11-07 00:15')`;
    await db.$executeRaw`INSERT INTO "BillingCustomer" ("customerId",livemode,"selectedSubscriptionId","selectedCanceledAt","deletedAt") VALUES ('cus_deleted',false,'sub_deleted','2026-11-06','2026-11-06')`;
    await db.$executeRaw`INSERT INTO "BillingOperation" (id,kind,digest,parameters,"deletedAt","closureCustomerId","closureSubscriptionId") VALUES ('deleted','checkout','','{}','2026-11-06','cus_deleted','sub_deleted')`;
    await db.$executeRaw`INSERT INTO "LoginProof" ("tokenHash","userId",email,"expiresAt") VALUES ('synthetic-proof',${user.id},'owner@example.invalid','2026-12-01')`;
    await db.$executeRaw`INSERT INTO "IdentitySession" ("tokenHash","userId",email,"expiresAt") VALUES ('synthetic-session',${user.id},'owner@example.invalid','2026-12-01')`;
    await db.artist.create({ data: { id: 1, name: 'Synthetic' } });
    await db.raga.create({ data: { id: 1, name: 'Synthetic' } });
    await db.mediaType.create({ data: { id: 1, name: 'Synthetic' } });
    await db.category.create({ data: { id: 1, name: 'Synthetic' } });
    await db.location.create({ data: { id: 1, name: 'Synthetic' } });
    await db.event.create({
      data: {
        id: 1,
        eventName: 'Synthetic',
        date: '2026-11-07',
        locationId: 1,
        categoryId: 1,
      },
    });
    await db.tape.create({ data: { id: 1, tapeId: 1, eventId: 1 } });
    for (const [id, plays] of [
      [1, 432],
      [2, null],
    ])
      await db.track.create({
        data: {
          id,
          plays,
          trackId: id,
          tapeId: 1,
          ragaId: 1,
          primaryArtistId: 1,
          mediaTypeId: 1,
          public: false,
          url: 'https://synthetic.invalid/preserved-reference',
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
    await db.tribute.create({
      data: { submittedBy: 'Synthetic', type: 'text', content: 'Keep this' },
    });
    const before = {
      tracks: await db.track.findMany({ orderBy: { id: 'asc' } }),
      tributes: await db.tribute.findMany({}),
      ops: await db.billingOperation.findMany({}),
    };
    assert.equal(upgrade().status, 0);
    assert.deepEqual(
      await db.track.findMany({ orderBy: { id: 'asc' } }),
      before.tracks
    );
    assert.deepEqual(await db.tribute.findMany({}), before.tributes);
    assert.deepEqual(await db.billingOperation.findMany({}), before.ops);
    const live = await db.billingCustomer.findUnique({
      where: { customerId: 'cus_upgrade' },
    });
    assert.equal(live.selectedSubscriptionId, 'sub_upgrade');
    for (const key of [
      'accessCheckedAt',
      'accessPolicyKey',
      'cachedStatus',
      'accessFreshUntil',
    ])
      assert.equal(live[key], null);
    const tombstone = await db.billingCustomer.findUnique({
      where: { customerId: 'cus_deleted' },
    });
    assert.ok(tombstone.deletedAt && tombstone.selectedCanceledAt);
    const owner = await db.user.findUnique({ where: { id: user.id } });
    assert.equal(owner.isAdmin, true);
    assert.equal(owner.deletionRevision, 3);
    assert.ok(owner.deletionRequestedAt);
    assert.equal(await db.loginProof.count(), 1);
    assert.equal(await db.identitySession.count(), 1);
    assert.equal(upgrade().status, 0);
    const columns =
      await db.$queryRaw`SELECT table_name,column_name FROM information_schema.columns WHERE table_schema=current_schema()`;
    assert.ok(
      !columns.some(
        (row) =>
          ['TrackPlay', 'NetworkError'].includes(row.table_name) ||
          ['deletionNotice', 'cachedPaidFrom', 'cachedPaidThrough'].includes(
            row.column_name
          )
      )
    );
  }));
