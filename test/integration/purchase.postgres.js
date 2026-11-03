const assert = require('node:assert/strict');
const { test, before, beforeEach, after } = require('node:test');
const { PrismaClient } = require('@prisma/client');
const { createPurchase } = require('../../billing/purchase');
const { config } = require('../support/billing-provider');
const { purchaseCases, buyer, providerCalls } = require('../support/purchase-cases');
const { postEvent, cancellation, pauseInvoice } = require('../support/paid-access-cases');
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
purchaseCases({ test: (name, work) => test(name, { timeout: 10000 }, work), fixture: () => f });
async function independent(work) {
  const db = new PrismaClient({ datasources: { db: { url: database.url } } });
  try {
    return await work(
      db,
      createPurchase({
        db,
        stripe: f.stripe,
        config,
        clientOrigin: f.config.clientOrigin,
        now: f.clock,
        access: f.access(),
      })
    );
  } finally {
    await db.$disconnect();
  }
}
test('PostgreSQL: independent clients reserve one attempt and concurrent case-insensitive registration creates one identity', async () => {
  await independent(async (_other, purchase) => {
    await Promise.all([
      f.signup('Mixed@example.invalid'),
      purchase.register({ firstName: 'New', lastName: 'Account', email: 'mixed@example.invalid' }),
    ]);
    const users = await database.db.user.findMany({
      where: { email: { equals: 'mixed@example.invalid', mode: 'insensitive' } },
    });
    assert.equal(users.length, 1);
    const results = await Promise.all(
      Array.from({ length: 8 }, (_, i) => (i % 2 ? purchase : f.purchase).checkout(users[0].id))
    );
    assert.equal(new Set(results.map((r) => r.attempt)).size, 1);
    assert.equal(f.stripe.resources.sessions.length, 1);
  });
});
test('PostgreSQL: provider success and failed session-ID write recover with original persisted key', async () => {
  const { cookie, user } = await buyer(f);
  await database.db.$executeRawUnsafe(
    'ALTER TABLE "BillingOperation" ADD CONSTRAINT synthetic_id_failure CHECK ("externalId" IS NULL) NOT VALID'
  );
  try {
    assert.equal((await f.start(cookie)).status, 500);
  } finally {
    await database.db.$executeRawUnsafe(
      'ALTER TABLE "BillingOperation" DROP CONSTRAINT synthetic_id_failure'
    );
  }
  const before = await f.operation(user.id);
  assert.equal(before.externalId, null);
  assert.equal(f.stripe.resources.sessions.length, 1);
  assert.equal((await f.start(cookie)).body.attempt, before.id);
  assert.equal(f.stripe.resources.sessions.length, 1);
  const after = await f.operation(user.id);
  assert.equal(after.externalId, f.stripe.resources.sessions[0].id);
});
test('PostgreSQL: webhook before session-ID persistence converges; failed binding commit rolls back all authority', async () => {
  const { cookie, user } = await buyer(f);
  const create = f.stripe.checkout.sessions.create;
  f.stripe.checkout.sessions.create = async (...args) => {
    const session = await create(...args);
    f.complete(session.id);
    assert.equal((await f.notify(session.id)).status, 200);
    return session;
  };
  try {
    assert.equal((await f.start(cookie)).status, 200);
  } finally {
    f.stripe.checkout.sessions.create = create;
  }
  const op = await f.operation(user.id);
  assert.equal(op.state, 'completed');
  assert.equal((await f.customer(user.id)).selectedSubscriptionId, 'sub_purchase_1');
  const e = f.stripe.resources.subscriptions[0];
  e.status = 'canceled';
  await postEvent(f, cancellation(e));
  await f.start(cookie);
  const next = await f.operation(user.id);
  f.complete(next.externalId);
  await database.db.$executeRawUnsafe(
    'ALTER TABLE "User" ADD CONSTRAINT synthetic_bind_failure CHECK ("stripeId" IS NULL) NOT VALID'
  );
  try {
    assert.equal((await f.notify(next.externalId)).status, 500);
    assert.equal((await f.customer(user.id)).selectedSubscriptionId, e.id);
    assert.equal((await f.operation(user.id)).state, 'pending');
  } finally {
    await database.db.$executeRawUnsafe('ALTER TABLE "User" DROP CONSTRAINT synthetic_bind_failure');
  }
  assert.equal((await f.notify(next.externalId)).status, 200);
});
test('PostgreSQL: completion suspended before commit cannot bypass independent pending deletion', async () => {
  const { cookie, user } = await buyer(f);
  await f.start(cookie);
  const op = await f.operation(user.id);
  f.complete(op.externalId);
  const retrieve = f.stripe.subscriptions.retrieve;
  let arrived, release;
  const ready = new Promise((r) => {
      arrived = r;
    }),
    gate = new Promise((r) => {
      release = r;
    });
  f.stripe.subscriptions.retrieve = async (...args) => {
    const s = await retrieve(...args);
    arrived();
    await gate;
    return s;
  };
  const pending = f.notify(op.externalId);
  try {
    await ready;
    await independent(async (db) =>
      db.user.update({ where: { id: user.id }, data: { deletionRequestedAt: f.clock() } })
    );
    release();
    assert.equal((await pending).status, 200);
    assert.equal(await f.customer(user.id), null);
  } finally {
    release();
    f.stripe.subscriptions.retrieve = retrieve;
    await pending;
  }
});
test('PostgreSQL: a suspended old paid fill cannot populate a replacement binding', async () => {
  const { cookie, user } = await buyer(f);
  await f.start(cookie);
  const op = await f.operation(user.id);
  const e = f.complete(op.externalId);
  await f.notify(op.externalId);
  const gate = pauseInvoice(f);
  const pending = f.play(cookie);
  try {
    await gate.arrived;
    e.sub.status = 'canceled';
    await postEvent(f, cancellation(e.sub));
    await f.start(cookie);
    const next = await f.operation(user.id);
    f.complete(next.externalId);
    await f.notify(next.externalId);
    gate.release();
    assert.equal((await pending).status, 403);
    assert.equal((await f.customer(user.id)).accessCheckedAt, null);
  } finally {
    gate.release();
    gate.restore();
    await pending;
  }
});
test('PostgreSQL: customer/selection/session uniqueness prevents conflicting association', async () => {
  const a = await buyer(f),
    b = await buyer(f, 'other@example.invalid');
  await f.start(a.cookie);
  const first = await f.operation(a.user.id);
  f.complete(first.externalId);
  await f.notify(first.externalId);
  await f.start(b.cookie);
  const second = await f.operation(b.user.id);
  f.complete(second.externalId);
  const session = f.stripe.resources.sessions[1];
  session.customer = (await f.customer(a.user.id)).customerId;
  f.stripe.resources.subscriptions[1].customer = session.customer;
  assert.equal((await f.confirm(b.cookie, session.id)).body.action, 'help');
  assert.equal(await f.customer(b.user.id), null);
  await assert.rejects(
    database.db.billingOperation.update({ where: { id: second.id }, data: { externalId: first.externalId } })
  );
});

test('PostgreSQL: a newly persisted session ID cannot turn a stale unknown-outcome read into a replacement', async () => {
  const { cookie, user } = await buyer(f);
  const create = f.stripe.checkout.sessions.create;
  f.stripe.checkout.sessions.create = async () => {
    throw Error('synthetic outage');
  };
  assert.equal((await f.start(cookie)).status, 503);
  f.stripe.checkout.sessions.create = create;
  await independent(async (other, purchase) => {
    const find = other.billingOperation.findUnique;
    let arrived,
      release,
      held = false;
    const ready = new Promise((r) => {
      arrived = r;
    });
    const gate = new Promise((r) => {
      release = r;
    });
    other.billingOperation.findUnique = async (args) => {
      const snapshot = await find(args);
      if (!held && args.where.activeKey) {
        held = true;
        arrived();
        await gate;
      }
      return snapshot;
    };
    const delayed = purchase.checkout(user.id);
    try {
      await ready;
      const recovered = await f.start(cookie);
      assert.equal(recovered.status, 200);
      release();
      assert.equal((await delayed).attempt, recovered.body.attempt);
      assert.equal(f.stripe.resources.sessions.length, 1);
      assert.equal(await other.billingOperation.count({ where: { userId: user.id } }), 1);
    } finally {
      release();
      other.billingOperation.findUnique = find;
      await delayed;
    }
  });
});
