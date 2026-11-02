const assert = require('node:assert/strict');
const { test, before, beforeEach, after } = require('node:test');
const { PrismaClient } = require('@prisma/client');
const { createDeletion } = require('../../billing/deletion');
const {
  deletionCases,
  setup,
  request,
  review,
  action,
  finish,
  gate,
} = require('../support/deletion-cases');
let database, f;
before(async () => {
  database = await require('../support/purchase-postgres')(process.env.TEST_DATABASE_URL);
  f = await require('../support/purchase-http')({ db: database.db });
});
beforeEach(async () => {
  await f.reset();
  await database.clear();
});
after(async () => {
  try {
    if (f) await f.close();
  } finally {
    if (database) await database.close();
  }
});
deletionCases({
  test: (name, fn) => test(name, { timeout: 10000 }, fn),
  fixture: () => f,
});
async function independent(work) {
  const db = new PrismaClient({ datasources: { db: { url: database.url } } });
  const deletion = createDeletion({
    db,
    purchase: f.purchase,
    now: f.clock,
    clientOrigin: f.config.clientOrigin,
  });
  try {
    return await work(db, deletion);
  } finally {
    await db.$disconnect();
  }
}
test('PostgreSQL D9: transaction failure rolls back deletion, cache, scrubbing and cascades', async () => {
  const { a, o } = await setup(f);
  await f.start(a.cookie);
  const op = await f.operation(a.user.id);
  f.complete(op.externalId, { status: 'canceled' });
  await f.notify(op.externalId);
  await f.prisma.trackPlay.create({
    data: { userId: a.user.id, trackId: 20, secondsListened: 10 },
  });
  await request(f, a);
  const r = await review(f, o, a);
  await f.prisma.$executeRawUnsafe(
    'CREATE TABLE synthetic_deletion_guard ("userId" INTEGER REFERENCES "User"(id) ON DELETE RESTRICT)'
  );
  await f.prisma.$executeRaw`INSERT INTO synthetic_deletion_guard ("userId") VALUES (${a.user.id})`;
  try {
    assert.equal((await finish(f, o, a, r.body.review)).status, 500);
  } finally {
    await f.prisma.$executeRawUnsafe('DROP TABLE synthetic_deletion_guard');
  }
  assert.ok((await f.me(a.cookie)).id);
  assert.equal(await f.prisma.trackPlay.count(), 1);
  assert.equal((await f.operation(a.user.id)).deletedAt, null);
  assert.equal((await finish(f, o, a, r.body.review)).status, 200);
});
test('PostgreSQL D9: local facts rechecked under independent-client purchase lock', async () => {
  const { a, o } = await setup(f);
  await f.start(a.cookie);
  const op = await f.operation(a.user.id);
  f.stripe.resources.sessions[0].status = 'expired';
  await request(f, a);
  const r = await review(f, o, a);
  const hold = gate(),
    original = f.stripe.checkout.sessions.retrieve;
  f.stripe.checkout.sessions.retrieve = async (...args) => {
    const s = await original(...args);
    hold.arrive();
    await hold.wait;
    return s;
  };
  const pending = finish(f, o, a, r.body.review);
  try {
    await hold.arrived;
    await independent(async (_db, deletion) =>
      deletion.withdraw(o.user.id, a.user.id, r.body.review)
    );
    hold.release();
    assert.equal((await pending).status, 409);
    assert.equal(
      (await f.prisma.user.findUnique({ where: { id: a.user.id } })).deletionRequestedAt,
      null
    );
  } finally {
    hold.release();
    f.stripe.checkout.sessions.retrieve = original;
    await pending;
  }
});
test('PostgreSQL D9: concurrent proof exchange and session creation cannot escape deletion cascades', async () => {
  const { a, o } = await setup(f);
  await f.json('auth/login', { email: a.user.email });
  const token = new URL(f.mail.at(-1).link).hash.slice(7);
  await request(f, a);
  const r = await review(f, o, a);
  const hold = gate();
  await independent(async (other, deletion) => {
    let queued;
    const locked = other.$transaction(async (tx) => {
      await require('../../identity/account-lock').lockAccount(tx, a.user.id);
      hold.arrive();
      await hold.wait;
    });
    await hold.arrived;
    const verified = f.json('auth/verify', { token });
    queued = deletion.complete(o.user.id, a.user.id, r.body.review, true);
    hold.release();
    await locked;
    const results = await Promise.all([verified, queued]);
    assert.ok([200, 401].includes(results[0].status));
    assert.deepEqual(results[1], { completed: true });
  });
  assert.equal(await f.prisma.identitySession.count({ where: { userId: a.user.id } }), 0);
  assert.equal(await f.prisma.loginProof.count({ where: { userId: a.user.id } }), 0);
});
test('PostgreSQL D9: two independent owners can safely retry ambiguous completion', async () => {
  const { a, o } = await setup(f);
  await request(f, a);
  const r = await review(f, o, a);
  await independent(async (_db, deletion) => {
    const result = await Promise.all([
      finish(f, o, a, r.body.review),
      deletion.complete(o.user.id, a.user.id, r.body.review, true),
    ]);
    assert.equal(result[0].status, 200);
    assert.deepEqual(result[1], { completed: true });
  });
  assert.equal(await f.prisma.user.findUnique({ where: { id: a.user.id } }), null);
});
