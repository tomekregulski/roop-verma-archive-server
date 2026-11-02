// Dedicated loopback schemas only; never consumes DATABASE_URL or dotenv.
const { PrismaClient } = require('@prisma/client');
const { randomUUID } = require('node:crypto');
const { spawnSync } = require('node:child_process');
module.exports = async function purchasePostgres(source) {
  const url = new URL(source);
  if (
    !['postgres:', 'postgresql:'].includes(url.protocol) ||
    !['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname) ||
    url.pathname !== '/rvdl_identity_test' ||
    [...url.searchParams.keys()].some((k) => k !== 'connection_limit')
  )
    throw Error('Refusing non-disposable database');
  const admin = new PrismaClient({ datasources: { db: { url: url.href } } });
  const schema = 'purchase_test_' + randomUUID().replaceAll('-', '');
  let db;
  const close = async () => {
    try {
      if (db) await db.$disconnect();
      await admin.$executeRawUnsafe(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
    } finally {
      await admin.$disconnect();
    }
  };
  try {
    await admin.$executeRawUnsafe(`CREATE SCHEMA "${schema}"`);
    url.searchParams.set('schema', schema);
    const result = spawnSync(process.execPath, ['node_modules/prisma/build/index.js', 'migrate', 'deploy'], {
      cwd: require('node:path').resolve(__dirname, '../..'),
      encoding: 'utf8',
      timeout: 60000,
      env: { ...process.env, DATABASE_URL: url.href, HEROKU_POSTGRESQL_BROWN_URL: url.href },
    });
    if (result.status !== 0) throw Error('Disposable migration replay failed');
    db = new PrismaClient({ datasources: { db: { url: url.href } } });
    await db.artist.create({ data: { id: 1, name: 'Synthetic' } });
    await db.raga.create({ data: { id: 1, name: 'Synthetic' } });
    await db.mediaType.create({ data: { id: 1, name: 'Synthetic' } });
    await db.category.create({ data: { id: 1, name: 'Synthetic' } });
    await db.location.create({ data: { id: 1, name: 'Synthetic' } });
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
    const clear = async () => {
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
    };
    return { db, schema, url: url.href, clear, close };
  } catch (error) {
    await close();
    throw error;
  }
};
