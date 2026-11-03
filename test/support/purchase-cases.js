const assert = require('node:assert/strict');
const { postEvent, cancellation } = require('./paid-access-cases');
async function buyer(f, email) {
  assert.equal((await f.signup(email)).status, 202);
  const cookie = await f.login(email || 'new@example.invalid');
  const user = await f.me(cookie);
  return { cookie, user };
}
const providerCalls = (f) => f.calls.filter((c) => c.startsWith('stripe.'));
function purchaseCases({ test, fixture }) {
  test('D1: verified local signup has no customer/provider work; positive evidence alone enables playback', async () => {
    const f = fixture(),
      { cookie, user } = await buyer(f);
    assert.equal(user.stripeId, null);
    assert.equal(await f.customer(user.id), null);
    assert.deepEqual(providerCalls(f), []);
    assert.equal((await f.play(cookie)).status, 403);
    assert.equal((await f.summary(cookie)).body.action, 'purchase');
    const started = await f.start(cookie);
    assert.equal(started.body.reason, 'checkout_open');
    const operation = await f.operation(user.id);
    assert.equal(operation.customerId, null);
    assert.equal(operation.parameters.request.customer, undefined);
    assert.equal(await f.customer(user.id), null);
    f.complete(operation.externalId, { invoice: false });
    assert.equal((await f.confirm(cookie, operation.externalId)).body.action, 'manage');
    assert.equal((await f.play(cookie)).status, 403);
    const sub = (await f.customer(user.id)).selectedSubscriptionId;
    f.stripe.paidInvoice({
      key: 'later',
      customerId: (await f.customer(user.id)).customerId,
      subscriptionId: sub,
    });
    f.advance(1);
    f.calls.length = 0;
    assert.equal((await f.play(cookie)).status, 200);
    assert.deepEqual(providerCalls(f), ['stripe.subscriptions.retrieve', 'stripe.invoices.list']);
    f.calls.length = 0;
    assert.equal((await f.play(cookie)).status, 200);
    assert.deepEqual(providerCalls(f), []);
    assert.equal('checkoutOwnership' in f.prisma, false, 'only the owned attempt stores Checkout ownership');
  });
  test('signup repeats do not overwrite account names or create Stripe customers', async () => {
    const f = fixture();
    await f.signup();
    assert.equal(
      (
        await f.json('user/synthetic-public-key', {
          firstName: 'Changed',
          lastName: 'Name',
          email: 'NEW@example.invalid',
        })
      ).status,
      202
    );
    const rows = await f.prisma.user.findMany({
      where: { email: { equals: 'new@example.invalid', mode: 'insensitive' } },
    });
    assert.equal(rows.length, 1);
    assert.equal(rows[0].firstName, 'New');
    assert.deepEqual(providerCalls(f), []);
  });
  test('unverified and tampered purchase requests perform no provider work', async () => {
    const f = fixture();
    await f.signup();
    assert.equal((await f.start()).status, 401);
    const cookie = await f.login('new@example.invalid');
    for (const body of [
      { customer: 'cus_other' },
      { price: 'price_other' },
      { quantity: 5 },
      { success_url: 'https://evil.invalid' },
    ])
      assert.equal((await f.json('payment/checkout/synthetic-public-key', body, cookie)).status, 400);
    assert.deepEqual(providerCalls(f), []);
  });
  test('repeated and concurrent requests share one owned attempt and one provider session', async () => {
    const f = fixture(),
      { cookie, user } = await buyer(f);
    const results = await Promise.all(Array.from({ length: 8 }, () => f.start(cookie)));
    assert.ok(results.every((r) => r.status === 200));
    assert.equal(new Set(results.map((r) => r.body.attempt)).size, 1);
    assert.equal(f.stripe.resources.sessions.length, 1);
    assert.equal(await f.prisma.billingOperation.count({ where: { userId: user.id } }), 1);
    console.log(
      'Concurrent purchase requests: ' +
        JSON.stringify({
          storage: f.prisma.tables ? 'memory' : 'PostgreSQL',
          checkoutPOSTs: providerCalls(f).filter((c) => c === 'stripe.checkout.create').length,
          sessionGETs: providerCalls(f).filter((c) => c === 'stripe.sessions.retrieve').length,
          logicalSessions: 1,
        })
    );
    const before = providerCalls(f).length;
    assert.equal((await f.start(cookie)).body.reason, 'checkout_open');
    assert.deepEqual(providerCalls(f).slice(before), ['stripe.sessions.retrieve']);
  });
  for (const order of ['webhook-first', 'return-first', 'missed-return'])
    test('completion converges: ' + order, async () => {
      const f = fixture(),
        { cookie, user } = await buyer(f);
      await f.start(cookie);
      const operation = await f.operation(user.id);
      f.complete(operation.externalId);
      if (order === 'return-first') assert.equal((await f.confirm(cookie, operation.externalId)).status, 200);
      assert.equal((await f.notify(operation.externalId)).status, 200);
      assert.equal((await f.notify(operation.externalId)).status, 200);
      if (order !== 'missed-return')
        assert.equal((await f.confirm(cookie, operation.externalId)).body.action, 'manage');
      const b = await f.customer(user.id);
      assert.equal(b.selectedSubscriptionId, 'sub_purchase_1');
      assert.equal((await f.me(cookie)).stripeId, b.customerId);
      assert.equal(await f.prisma.billingCustomer.count({ where: { userId: user.id } }), 1);
      assert.equal((await f.play(cookie)).status, 200);
    });
  test('cross-account return and forged completion signature cannot establish authority', async () => {
    const f = fixture(),
      a = await buyer(f),
      b = await buyer(f, 'other@example.invalid');
    await f.start(a.cookie);
    const op = await f.operation(a.user.id);
    f.complete(op.externalId);
    f.calls.length = 0;
    assert.equal((await f.confirm(b.cookie, op.externalId)).status, 403);
    assert.deepEqual(providerCalls(f), []);
    assert.equal((await postEvent(f, f.completedEvent(op.externalId), false)).status, 400);
    assert.equal(await f.customer(a.user.id), null);
    assert.equal(await f.customer(b.user.id), null);
  });
  for (const change of ['mode', 'livemode', 'price', 'quantity', 'metadata', 'trial', 'zero'])
    test('unsupported completion fails closed: ' + change, async () => {
      const f = fixture(),
        { cookie, user } = await buyer(f);
      await f.start(cookie);
      const op = await f.operation(user.id);
      const e = f.complete(op.externalId);
      const s = f.stripe.resources.sessions[0];
      if (change === 'mode') s.mode = 'payment';
      if (change === 'livemode') s.livemode = true;
      if (change === 'price') s.line_items.data[0].price.id = 'price_wrong';
      if (change === 'quantity') s.line_items.data[0].quantity = 2;
      if (change === 'metadata') s.metadata.billing_operation = 'wrong';
      if (change === 'trial') e.sub.trial_start = 1;
      if (change === 'zero') s.amount_total = 0;
      const result = await f.confirm(cookie, op.externalId);
      assert.ok(result.status >= 400 || result.body.action === 'help');
      assert.equal(await f.customer(user.id), null);
      assert.equal((await f.play(cookie)).status, 403);
    });
  test('incomplete payment stays pending; a successful redirect alone is never payment', async () => {
    const f = fixture(),
      { cookie, user } = await buyer(f);
    await f.start(cookie);
    const op = await f.operation(user.id);
    f.complete(op.externalId, { payment: 'unpaid' });
    assert.equal((await f.confirm(cookie, op.externalId)).body.reason, 'payment_pending');
    assert.equal(await f.customer(user.id), null);
    assert.equal((await f.play(cookie)).status, 403);
    assert.equal((await f.start(cookie)).body.action, 'pending');
    assert.equal(f.stripe.resources.sessions.length, 1);
  });
  test('abandoned open Checkout resumes after 23h; unknown old outcomes require help', async () => {
    const f = fixture(),
      { cookie, user } = await buyer(f);
    await f.start(cookie);
    const op = await f.operation(user.id);
    f.advance(24 * 3600000);
    assert.equal((await f.start(cookie)).body.reason, 'checkout_open');
    await f.prisma.billingOperation.update({ where: { id: op.id }, data: { externalId: null } });
    f.calls.length = 0;
    assert.equal((await f.start(cookie)).body.action, 'help');
    assert.deepEqual(providerCalls(f), []);
    assert.equal(f.stripe.resources.sessions.length, 1);
  });
  test('expired known session can be replaced without adopting an old completion', async () => {
    const f = fixture(),
      { cookie, user } = await buyer(f);
    await f.start(cookie);
    const old = await f.operation(user.id);
    f.stripe.resources.sessions[0].status = 'expired';
    assert.equal((await f.start(cookie)).status, 200);
    const newer = await f.operation(user.id);
    assert.notEqual(newer.id, old.id);
    f.complete(old.externalId);
    assert.equal((await f.notify(old.externalId)).status, 200);
    assert.equal(await f.customer(user.id), null);
    f.complete(newer.externalId);
    assert.equal((await f.notify(newer.externalId)).status, 200);
    assert.equal((await f.customer(user.id)).selectedSubscriptionId, 'sub_purchase_2');
  });
  test('ongoing selected subscription directs management; period-end cancellation does not start a second purchase', async () => {
    const f = fixture(),
      { cookie, user } = await buyer(f);
    await f.start(cookie);
    const op = await f.operation(user.id),
      e = f.complete(op.externalId);
    await f.notify(op.externalId);
    e.sub.cancel_at_period_end = true;
    f.calls.length = 0;
    assert.equal((await f.start(cookie)).body.action, 'manage');
    assert.equal((await f.summary(cookie)).body.action, 'manage');
    assert.equal(f.stripe.resources.sessions.length, 1);
    assert.ok(!providerCalls(f).includes('stripe.checkout.create'));
  });
  test('ongoing unsupported billing arrangements still manage rather than permit another purchase', async () => {
    const f = fixture(),
      { cookie, user } = await buyer(f);
    await f.start(cookie);
    const op = await f.operation(user.id),
      e = f.complete(op.externalId);
    await f.notify(op.externalId);
    for (const status of ['paused', 'trialing', 'unpaid', 'incomplete']) {
      e.sub.status = status;
      assert.equal((await f.start(cookie)).body.action, 'manage');
      assert.equal((await f.summary(cookie)).body.action, 'manage');
    }
    assert.equal(f.stripe.resources.sessions.length, 1);
  });
  for (const when of ['before-customer', 'after-customer'])
    test('pending deletion blocks purchase and association: ' + when, async () => {
      const f = fixture(),
        { cookie, user } = await buyer(f);
      await f.start(cookie);
      const op = await f.operation(user.id);
      f.complete(op.externalId);
      if (when === 'after-customer') await f.notify(op.externalId);
      await f.prisma.user.update({ where: { id: user.id }, data: { deletionRequestedAt: f.clock() } });
      const before = await f.customer(user.id);
      assert.equal((await f.start(cookie)).body.action, 'help');
      assert.equal((await f.notify(op.externalId)).status, 200);
      assert.deepEqual(await f.customer(user.id), before);
    });
  test('late signed completion cannot recreate deleted identity', async () => {
    const f = fixture(),
      { cookie, user } = await buyer(f);
    await f.start(cookie);
    const op = await f.operation(user.id);
    f.complete(op.externalId);
    await f.prisma.user.delete({ where: { id: user.id } });
    assert.equal((await f.notify(op.externalId)).status, 200);
    assert.equal(await f.prisma.user.findUnique({ where: { id: user.id } }), null);
    assert.equal(await f.customer(user.id), null);
    assert.equal((await f.confirm(cookie, op.externalId)).status, 401);
  });
  test('replacement clears old snapshot/veto; old completion and old cancellation cannot affect it', async () => {
    const f = fixture(),
      { cookie, user } = await buyer(f);
    await f.start(cookie);
    const old = await f.operation(user.id),
      e = f.complete(old.externalId);
    await f.notify(old.externalId);
    assert.equal((await f.play(cookie)).status, 200);
    e.sub.status = 'canceled';
    await postEvent(f, cancellation(e.sub));
    assert.ok((await f.customer(user.id)).selectedCanceledAt);
    assert.equal((await f.start(cookie)).status, 200);
    const next = await f.operation(user.id);
    assert.equal(next.customerId, e.sub.customer);
    f.complete(next.externalId);
    await f.notify(next.externalId);
    const b = await f.customer(user.id);
    assert.equal(b.selectedCanceledAt, null);
    assert.equal(b.accessCheckedAt, null);
    await f.notify(old.externalId);
    await postEvent(f, cancellation(e.sub));
    assert.equal((await f.customer(user.id)).selectedSubscriptionId, 'sub_purchase_2');
    assert.equal((await f.play(cookie)).status, 200);
  });
  test('duplicate completion for the same subscription preserves terminal cancellation veto', async () => {
    const f = fixture(),
      { cookie, user } = await buyer(f);
    await f.start(cookie);
    const op = await f.operation(user.id),
      e = f.complete(op.externalId);
    await f.notify(op.externalId);
    await postEvent(f, cancellation(e.sub));
    await f.notify(op.externalId);
    assert.ok((await f.customer(user.id)).selectedCanceledAt);
    assert.equal((await f.play(cookie)).status, 403);
  });
  test('provider outage preserves the owned attempt and never falls back to discovery', async () => {
    const f = fixture(),
      { cookie, user } = await buyer(f);
    const original = f.stripe.checkout.sessions.create;
    f.stripe.checkout.sessions.create = async () => {
      throw Error('synthetic outage');
    };
    assert.equal((await f.start(cookie)).status, 503);
    const op = await f.operation(user.id);
    assert.ok(op);
    assert.equal(op.externalId, null);
    f.stripe.checkout.sessions.create = original;
    assert.equal((await f.start(cookie)).body.attempt, op.id);
    assert.equal(f.stripe.resources.sessions.length, 1);
  });
  test('a return after a lost session-ID write recovers through the retained key, not the supplied ID', async () => {
    const f = fixture(),
      { cookie, user } = await buyer(f);
    await f.start(cookie);
    const op = await f.operation(user.id);
    f.complete(op.externalId);
    await f.prisma.billingOperation.update({ where: { id: op.id }, data: { externalId: null } });
    f.calls.length = 0;
    assert.equal((await f.confirm(cookie, op.externalId)).body.action, 'manage');
    assert.equal((await f.operation(user.id)).id, op.id);
    assert.equal(f.stripe.resources.sessions.length, 1);
    assert.ok(providerCalls(f).includes('stripe.checkout.create'));
  });
  test('completion already canceled before association installs its own veto', async () => {
    const f = fixture(),
      { cookie, user } = await buyer(f);
    await f.start(cookie);
    const op = await f.operation(user.id);
    f.complete(op.externalId, { status: 'canceled' });
    assert.equal((await f.notify(op.externalId)).status, 200);
    assert.ok((await f.customer(user.id)).selectedCanceledAt);
    assert.equal((await f.play(cookie)).status, 403);
  });
  test('wrong event API/mode and unknown attempts do not provision accounts', async () => {
    const f = fixture(),
      { cookie, user } = await buyer(f);
    await f.start(cookie);
    const op = await f.operation(user.id);
    f.complete(op.externalId);
    for (const patch of [
      { api_version: 'unsupported' },
      { livemode: true },
      {
        data: {
          object: {
            ...f.completedEvent(op.externalId).data.object,
            metadata: { billing_operation: 'unknown' },
          },
        },
      },
    ]) {
      await postEvent(f, { ...f.completedEvent(op.externalId), ...patch });
      assert.equal(await f.customer(user.id), null);
    }
  });
  test('a future-dated unknown attempt cannot extend the safe POST retry window', async () => {
    const f = fixture(),
      { cookie, user } = await buyer(f);
    await f.start(cookie);
    const op = await f.operation(user.id);
    await f.prisma.billingOperation.update({
      where: { id: op.id },
      data: { externalId: null, createdAt: new Date(f.clock().getTime() + 60000) },
    });
    f.calls.length = 0;
    assert.equal((await f.start(cookie)).body.action, 'help');
    assert.deepEqual(providerCalls(f), []);
  });
  test('observed purchase/completion/playback request counts remain bounded', async () => {
    const f = fixture(),
      { cookie, user } = await buyer(f);
    f.calls.length = 0;
    await f.start(cookie);
    assert.deepEqual(providerCalls(f), ['stripe.checkout.create']);
    const op = await f.operation(user.id);
    f.calls.length = 0;
    await f.start(cookie);
    assert.deepEqual(providerCalls(f), ['stripe.sessions.retrieve']);
    f.complete(op.externalId);
    f.calls.length = 0;
    await f.confirm(cookie, op.externalId);
    assert.deepEqual(providerCalls(f), ['stripe.sessions.retrieve', 'stripe.subscriptions.retrieve']);
    f.calls.length = 0;
    await f.notify(op.externalId);
    assert.deepEqual(providerCalls(f), ['stripe.sessions.retrieve', 'stripe.subscriptions.retrieve']);
    f.calls.length = 0;
    await f.summary(cookie);
    assert.deepEqual(providerCalls(f), ['stripe.subscriptions.retrieve']);
    f.calls.length = 0;
    assert.equal((await f.play(cookie)).status, 200);
    assert.deepEqual(providerCalls(f), ['stripe.subscriptions.retrieve', 'stripe.invoices.list']);
    f.calls.length = 0;
    assert.equal((await f.play(cookie)).status, 200);
    assert.deepEqual(providerCalls(f), []);
  });
  test('normal candidate cannot call history discovery and Portal works only after association', async () => {
    const f = fixture(),
      { cookie, user } = await buyer(f);
    assert.equal(
      (await f.json('user/create-portal-session/synthetic-public-key', {}, cookie)).body.reason,
      'no_customer'
    );
    for (const endpoint of [
      f.stripe.customers,
      f.stripe.subscriptions,
      f.stripe.checkout.sessions,
      f.stripe.subscriptionSchedules,
    ])
      endpoint.list = async () => {
        throw Error('Discovery forbidden');
      };
    await f.start(cookie);
    const op = await f.operation(user.id);
    f.complete(op.externalId);
    await f.confirm(cookie, op.externalId);
    assert.equal(
      (await f.json('user/create-portal-session/synthetic-public-key', {}, cookie)).body.reason,
      'portal_open'
    );
    assert.equal((await f.play(cookie)).status, 200);
  });
}
module.exports = { purchaseCases, buyer, providerCalls };
