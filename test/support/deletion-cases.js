const assert = require('node:assert/strict');
const { buyer, providerCalls } = require('./purchase-cases');
async function owner(f) {
  const o = await buyer(f, 'owner@example.invalid');
  await f.prisma.user.update({
    where: { id: o.user.id },
    data: { isAdmin: true },
  });
  return o;
}
async function setup(f) {
  const a = await buyer(f);
  const o = await owner(f);
  return { a, o };
}
const review = (f, o, a) =>
  f.request('user/owner/deletions/' + a.user.id + '/synthetic-public-key', {
    headers: { Cookie: o.cookie, 'X-RVDL-CSRF': '1' },
  });
const action = (f, o, a, kind, body) =>
  f.json(
    'user/owner/deletions/' + a.user.id + '/' + kind + '/synthetic-public-key',
    body,
    o.cookie
  );
const request = (f, a, body = { confirm: true }) =>
  f.json('user/account-deletion/synthetic-public-key', body, a.cookie);
const finish = (f, o, a, token) =>
  action(f, o, a, 'complete', { review: token, dashboardClosed: true });
const gate = () => {
  let arrive, release;
  return {
    arrived: new Promise((r) => {
      arrive = r;
    }),
    wait: new Promise((r) => {
      release = r;
    }),
    arrive: () => arrive(),
    release: () => release(),
  };
};
function deletionCases({ test, fixture }) {
  test('D9: persisted-session request is idempotent, notified once and does not revoke login', async () => {
    const f = fixture(),
      { a, o } = await setup(f);
    const results = await Promise.all(Array.from({ length: 5 }, () => request(f, a)));
    assert.ok(results.every((r) => r.status === 200 && r.body.pending));
    assert.equal(f.notifications.length, 1);
    assert.equal(f.notifications[0].to[0], 'support@example.invalid');
    assert.ok(f.notifications[0].text.includes(a.user.email));
    assert.ok(f.notifications[0].text.includes('/owner/deletions?account=' + a.user.id));
    assert.ok(f.notifications[0].text.includes(f.clock().toISOString()));
    assert.equal((await f.me(a.cookie)).id, a.user.id);
    assert.equal((await f.summary(a.cookie)).body.reason, 'deletion_pending');
    assert.equal((await f.start(a.cookie)).body.reason, 'deletion_pending');
    assert.equal((await review(f, o, a)).body.account.notification, 'accepted');
    const list = await f.request('user/owner/deletions/synthetic-public-key', {
      headers: { Cookie: o.cookie, 'X-RVDL-CSRF': '1' },
    });
    assert.deepEqual(
      list.body.requests.map((r) => r.id),
      [a.user.id]
    );
    assert.equal(results[0].headers.get('cache-control'), 'no-store');
    assert.deepEqual(providerCalls(f), []);
  });
  test('D9: authentication, forged target, malformed confirmation and CSRF/origin are rejected', async () => {
    const f = fixture(),
      { a } = await setup(f);
    assert.equal(
      (
        await f.json('user/account-deletion/synthetic-public-key', {
          confirm: true,
        })
      ).status,
      401
    );
    for (const body of [
      {},
      { confirm: 'true' },
      { confirm: true, userId: 999 },
      { confirm: true, customerId: 'cus_other' },
      [],
    ])
      assert.equal((await request(f, a, body)).status, 400);
    for (const headers of [{ 'X-RVDL-CSRF': '' }, { Origin: 'https://evil.invalid' }])
      assert.equal(
        (
          await f.json(
            'user/account-deletion/synthetic-public-key',
            { confirm: true },
            a.cookie,
            headers
          )
        ).status,
        403
      );
    assert.equal(f.notifications.length, 0);
    assert.equal(
      (await f.prisma.user.findUnique({ where: { id: a.user.id } })).deletionRequestedAt,
      null
    );
  });
  test('D9: owner controls use current persisted admin authority and reject malformed/forged input', async () => {
    const f = fixture(),
      { a, o } = await setup(f);
    await request(f, a);
    assert.equal((await review(f, a, a)).status, 403);
    for (const target of ['0', '01', 'no', '1.2', '9007199254740992'])
      assert.equal(
        (
          await f.request('user/owner/deletions/' + target + '/synthetic-public-key', {
            headers: { Cookie: o.cookie, 'X-RVDL-CSRF': '1' },
          })
        ).status,
        400
      );
    assert.equal(
      (
        await action(f, o, a, 'complete', {
          review: 'forged',
          dashboardClosed: true,
        })
      ).status,
      400
    );
    const r = await review(f, o, a);
    assert.equal(
      (
        await action(f, o, a, 'complete', {
          review: r.body.review,
          dashboardClosed: false,
        })
      ).status,
      400
    );
    assert.equal(
      (
        await action(f, o, a, 'withdraw', {
          review: r.body.review,
          customerId: 'cus_other',
        })
      ).status,
      400
    );
    assert.equal(
      (
        await f.json(
          'user/owner/deletions/' + a.user.id + '/withdraw/synthetic-public-key',
          { review: r.body.review },
          o.cookie,
          { 'X-RVDL-CSRF': '' }
        )
      ).status,
      403
    );
    await f.prisma.user.update({
      where: { id: o.user.id },
      data: { isAdmin: false },
    });
    assert.equal((await review(f, o, a)).status, 403);
    assert.equal((await finish(f, o, a, r.body.review)).status, 403);
  });
  test('D9: notification failure/uncertainty leaves durable pending state and never resends', async () => {
    const f = fixture(),
      { a, o } = await setup(f);
    f.failMail();
    assert.equal((await request(f, a)).body.notification, 'uncertain');
    f.failMail(false);
    assert.equal((await request(f, a)).body.notification, 'uncertain');
    assert.equal(f.notifications.length, 1);
    assert.equal((await f.start(a.cookie)).body.reason, 'deletion_pending');
    assert.equal((await review(f, o, a)).body.account.notification, 'uncertain');
  });
  test('D9: absent support destination is explicit and does not undo the purchase block', async () => {
    const f = fixture(),
      { a } = await setup(f);
    const deletion = require('../../billing/deletion').createDeletion({
      db: f.prisma,
      purchase: f.purchase,
      now: f.clock,
      clientOrigin: f.config.clientOrigin,
    });
    assert.equal((await deletion.request(a.user.id)).notification, 'unconfigured');
    assert.equal((await f.start(a.cookie)).body.reason, 'deletion_pending');
    assert.equal(f.notifications.length, 0);
  });
  test('D9: trusted Portal and paid playback remain available while deletion is pending', async () => {
    const f = fixture(),
      { a } = await setup(f);
    await f.start(a.cookie);
    const op = await f.operation(a.user.id);
    f.complete(op.externalId);
    await f.notify(op.externalId);
    assert.equal((await f.play(a.cookie)).status, 200);
    await request(f, a);
    assert.equal((await f.play(a.cookie)).status, 200);
    assert.equal(
      (await f.json('user/create-portal-session/synthetic-public-key', {}, a.cookie)).body.reason,
      'portal_open'
    );
    assert.equal((await f.start(a.cookie)).body.reason, 'deletion_pending');
    assert.equal(f.stripe.resources.subscriptions[0].status, 'active');
  });
  test('D9: customer-null pending accounts still log in and have no Portal provider call', async () => {
    const f = fixture(),
      { a } = await setup(f);
    await request(f, a);
    const cookie = await f.login(a.user.email);
    f.calls.length = 0;
    assert.equal(
      (await f.json('user/create-portal-session/synthetic-public-key', {}, cookie)).body.reason,
      'no_customer'
    );
    assert.deepEqual(providerCalls(f), []);
  });
  test('D9: owner withdrawal restores ordinary safeguards, retains attempts, and changes no Stripe billing', async () => {
    const f = fixture(),
      { a, o } = await setup(f);
    await f.start(a.cookie);
    const op = await f.operation(a.user.id);
    await request(f, a);
    const r = await review(f, o, a);
    assert.equal((await action(f, o, a, 'withdraw', { review: r.body.review })).status, 200);
    assert.equal((await f.start(a.cookie)).body.attempt, op.id);
    assert.equal(f.stripe.resources.sessions.length, 1);
    await request(f, a);
    assert.equal(f.notifications.length, 2);
    assert.equal((await finish(f, o, a, r.body.review)).status, 409);
  });
  test('D9: in-flight provider creation retains late Session evidence without URL or association', async () => {
    const f = fixture(),
      { a, o } = await setup(f),
      hold = gate();
    const original = f.stripe.checkout.sessions.create;
    f.stripe.checkout.sessions.create = async (...args) => {
      const s = await original(...args);
      hold.arrive();
      await hold.wait;
      return s;
    };
    const started = f.start(a.cookie);
    try {
      await hold.arrived;
      await request(f, a);
      const r = await review(f, o, a);
      assert.ok(r.body.blockers.some((v) => v.startsWith('unknown_checkout:')));
      assert.equal((await finish(f, o, a, r.body.review)).status, 409);
      hold.release();
      const result = await started;
      assert.equal(result.body.reason, 'deletion_pending');
      assert.equal(result.body.url, undefined);
      assert.equal((await f.operation(a.user.id)).externalId, f.stripe.resources.sessions[0].id);
      assert.equal(await f.customer(a.user.id), null);
    } finally {
      hold.release();
      f.stripe.checkout.sessions.create = original;
      await started;
    }
  });
  test('D9: an expired creation response crossing deletion still preserves exact closure evidence', async () => {
    const f = fixture(), { a, o } = await setup(f), hold = gate();
    const original = f.stripe.checkout.sessions.create;
    f.stripe.checkout.sessions.create = async (...args) => {
      const session = await original(...args);
      f.stripe.resources.sessions[0].status = 'expired';
      session.status = 'expired';
      hold.arrive(); await hold.wait;
      return session;
    };
    const pending = f.start(a.cookie);
    try {
      await hold.arrived; await request(f, a); hold.release();
      const result = await pending;
      assert.equal(result.body.reason, 'deletion_pending'); assert.equal(result.body.url, undefined);
      assert.equal((await f.operation(a.user.id)).externalId, 'cs_test_1');
      const r = await review(f, o, a);
      assert.deepEqual(r.body.blockers, []);
      assert.equal((await finish(f, o, a, r.body.review)).status, 200);
    } finally { hold.release(); f.stripe.checkout.sessions.create = original; await pending; }
  });
  test('D9: lost Session-ID write recovered by signed callback while pending, even on inactive attempt', async () => {
    const f = fixture(),
      { a, o } = await setup(f);
    await f.start(a.cookie);
    const old = await f.operation(a.user.id);
    f.stripe.resources.sessions[0].status = 'expired';
    await f.start(a.cookie);
    await f.prisma.billingOperation.update({
      where: { id: old.id },
      data: { externalId: null },
    });
    await request(f, a);
    f.complete(old.externalId);
    assert.equal((await f.notify(old.externalId)).status, 200);
    assert.equal(
      (await f.prisma.billingOperation.findUnique({ where: { id: old.id } })).externalId,
      old.externalId
    );
    assert.equal(await f.customer(a.user.id), null);
    const r = await review(f, o, a);
    assert.equal(r.body.attempts.length, 2);
    assert.ok(r.body.blockers.some((v) => v.startsWith('ongoing_subscription:')));
  });
  for (const status of ['open', 'unknown', 'complete', 'period-end'])
    test('D9: unresolved closure blocks completion: ' + status, async () => {
      const f = fixture(),
        { a, o } = await setup(f);
      await f.start(a.cookie);
      const op = await f.operation(a.user.id);
      if (status === 'unknown')
        await f.prisma.billingOperation.update({
          where: { id: op.id },
          data: { externalId: null },
        });
      if (['complete', 'period-end'].includes(status)) {
        const e = f.complete(op.externalId);
        e.sub.cancel_at_period_end = status === 'period-end';
      }
      await request(f, a);
      const r = await review(f, o, a);
      assert.ok(r.body.blockers.length > 0);
      assert.equal((await finish(f, o, a, r.body.review)).status, 409);
      assert.equal((await f.me(a.cookie)).id, a.user.id);
      assert.equal(f.stripe.resources.sessions.length, 1);
    });
  test('D9: exact owner Session reference requires immutable ownership/mode and does not start Checkout', async () => {
    const f = fixture(),
      { a, o } = await setup(f);
    await f.start(a.cookie);
    const op = await f.operation(a.user.id);
    f.stripe.resources.sessions[0].status = 'expired';
    await f.prisma.billingOperation.update({
      where: { id: op.id },
      data: { externalId: null },
    });
    await request(f, a);
    assert.equal(
      (
        await action(f, o, a, 'exact-session', {
          attempt: 'foreign',
          sessionId: op.externalId,
        })
      ).status,
      403
    );
    const s = f.stripe.resources.sessions[0];
    for (const field of ['livemode', 'mode', 'metadata', 'client_reference_id']) {
      const old = structuredClone(s[field]);
      s[field] =
        field === 'livemode'
          ? true
          : field === 'metadata'
          ? { billing_operation: 'wrong' }
          : 'wrong';
      const response = await action(f, o, a, 'exact-session', {
        attempt: op.id,
        sessionId: op.externalId,
      });
      assert.ok(response.status >= 400);
      s[field] = old;
      assert.equal((await f.operation(a.user.id)).externalId, null);
    }
    f.calls.length = 0;
    assert.equal(
      (
        await action(f, o, a, 'exact-session', {
          attempt: op.id,
          sessionId: op.externalId,
        })
      ).status,
      200
    );
    assert.ok(!providerCalls(f).includes('stripe.checkout.create'));
    assert.equal((await review(f, o, a)).body.blockers.length, 0);
  });
  test('D9: Checkout completing after owner review is re-read and blocks deletion', async () => {
    const f = fixture(),
      { a, o } = await setup(f);
    await f.start(a.cookie);
    const op = await f.operation(a.user.id);
    await request(f, a);
    const r = await review(f, o, a);
    f.complete(op.externalId);
    assert.equal((await finish(f, o, a, r.body.review)).status, 409);
    assert.equal(await f.customer(a.user.id), null);
  });
  test('D9: provider outage never establishes closure and no new attempt/history discovery is used', async () => {
    const f = fixture(),
      { a, o } = await setup(f);
    await f.start(a.cookie);
    await request(f, a);
    const r = await review(f, o, a),
      original = f.stripe.checkout.sessions.retrieve;
    f.stripe.checkout.sessions.retrieve = async () => {
      throw Error('timeout');
    };
    try {
      assert.equal((await finish(f, o, a, r.body.review)).status, 503);
    } finally {
      f.stripe.checkout.sessions.retrieve = original;
    }
    assert.equal(f.stripe.resources.sessions.length, 1);
    assert.ok(await f.prisma.user.findUnique({ where: { id: a.user.id } }));
  });
  test('D9: support withdrawal remains available during provider outages', async () => {
    const f = fixture(),
      { a, o } = await setup(f);
    await f.start(a.cookie);
    await request(f, a);
    const original = f.stripe.checkout.sessions.retrieve;
    f.stripe.checkout.sessions.retrieve = async () => {
      throw Error('outage');
    };
    try {
      const r = await review(f, o, a);
      assert.equal(r.status, 200);
      assert.ok(r.body.blockers.includes('provider_unavailable'));
      assert.equal((await finish(f, o, a, r.body.review)).status, 503);
      assert.equal((await action(f, o, a, 'withdraw', { review: r.body.review })).status, 200);
    } finally {
      f.stripe.checkout.sessions.retrieve = original;
    }
    assert.equal((await f.start(a.cookie)).body.reason, 'checkout_open');
  });
  test('D9: legacy parameter retention conflicts remain blocked for investigation', async () => {
    const f = fixture(),
      { a, o } = await setup(f);
    await f.start(a.cookie);
    const op = await f.operation(a.user.id);
    await f.prisma.billingOperation.update({
      where: { id: op.id },
      data: { parameters: { email: a.user.email, version: 1 } },
    });
    await request(f, a);
    const r = await review(f, o, a);
    assert.ok(r.body.blockers.includes('unsupported_attempt:' + op.id));
    assert.equal((await finish(f, o, a, r.body.review)).status, 409);
    assert.equal((await f.operation(a.user.id)).parameters.email, a.user.email);
  });
  test('D9: completion requires pending request and can delete an account with no billing', async () => {
    const f = fixture(),
      { a, o } = await setup(f);
    assert.equal((await finish(f, o, a, 'a'.repeat(64))).status, 409);
    await request(f, a);
    const r = await review(f, o, a);
    f.calls.length = 0;
    assert.equal((await finish(f, o, a, r.body.review)).status, 200);
    assert.equal((await finish(f, o, a, r.body.review)).status, 200);
    assert.deepEqual(providerCalls(f), []);
    assert.equal((await f.request('auth/session', { headers: { Cookie: a.cookie } })).status, 401);
  });
  test('D9: playback waiting on asset mapping cannot authorize after completed deletion', async () => {
    const f = fixture(),
      { a, o } = await setup(f);
    await f.start(a.cookie);
    const op = await f.operation(a.user.id);
    const e = f.complete(op.externalId);
    await f.notify(op.externalId);
    const hold = gate();
    f.mappingHook = async () => {
      hold.arrive();
      await hold.wait;
    };
    const playing = f.play(a.cookie);
    try {
      await hold.arrived;
      await request(f, a);
      e.sub.status = 'canceled';
      assert.equal((await finish(f, o, a, (await review(f, o, a)).body.review)).status, 200);
      hold.release();
      assert.equal((await playing).status, 403);
      assert.equal(f.signatures.length, 0);
    } finally {
      hold.release();
      f.mappingHook = null;
      await playing;
    }
  });
  test('D9: absent binding cannot conceal a completed unassociated purchase', async () => {
    const f = fixture(),
      { a, o } = await setup(f);
    await f.start(a.cookie);
    const op = await f.operation(a.user.id);
    await request(f, a);
    f.complete(op.externalId);
    await f.notify(op.externalId);
    assert.equal(await f.customer(a.user.id), null);
    const r = await review(f, o, a);
    assert.ok(r.body.customers.includes('cus_purchase_1'));
    assert.ok(r.body.blockers.includes('ongoing_subscription:sub_purchase_1'));
  });
  test('D9: all inactive attempts and duplicate subscriptions must close', async () => {
    const f = fixture(),
      { a, o } = await setup(f);
    await f.start(a.cookie);
    const old = await f.operation(a.user.id);
    f.stripe.resources.sessions[0].status = 'expired';
    await f.start(a.cookie);
    const next = await f.operation(a.user.id);
    f.complete(old.externalId);
    f.complete(next.externalId, { status: 'canceled' });
    await request(f, a);
    const r = await review(f, o, a);
    assert.equal(r.body.attempts.length, 2);
    assert.ok(r.body.blockers.includes('ongoing_subscription:sub_purchase_1'));
    assert.equal((await finish(f, o, a, r.body.review)).status, 409);
    f.stripe.resources.subscriptions[0].status = 'canceled';
    assert.equal((await finish(f, o, a, (await review(f, o, a)).body.review)).status, 200);
    for (const customerId of ['cus_purchase_1', 'cus_purchase_2'])
      assert.ok((await f.prisma.billingCustomer.findUnique({ where: { customerId } })).deletedAt);
  });
  test('D9: completion deletes identity/sessions/proofs/legacy tokens/individual plays and scrubs diagnostics', async () => {
    const f = fixture(),
      { a, o } = await setup(f);
    await f.start(a.cookie);
    const op = await f.operation(a.user.id);
    f.complete(op.externalId, { status: 'canceled' });
    await f.notify(op.externalId);
    await f.login(a.user.email);
    await f.json('auth/login', { email: a.user.email });
    const proof = new URL(f.mail.at(-1).link).hash.slice(7);
    await f.prisma.token.create({
      data: {
        userId: a.user.id,
        emailToken: 'old-proof',
        type: 'login',
        expirationDate: f.clock(),
        expiration: 60,
      },
    });
    await f.prisma.trackPlay.create({
      data: { userId: a.user.id, trackId: 20, secondsListened: 50 },
    });
    const track = await f.prisma.track.findUnique({ where: { id: 20 } });
    for (const data of [
      {
        userId: a.user.id,
        userEmailAddress: a.user.email,
        errorMessage: 'New Account failed in request',
        errorType: 'raw personal data',
      },
      {
        userId: null,
        userEmailAddress: null,
        errorMessage: 'https://app.invalid/?email=new%40example.invalid',
        errorType: null,
      },
    ])
      await f.prisma.networkError.create({
        data: {
          ...data,
          errorCode: 503,
          isRegisteredUser: true,
          timestamp: f.clock(),
        },
      });
    await f.prisma.networkError.create({
      data: {
        errorCode: 503,
        isRegisteredUser: false,
        userId: null,
        userEmailAddress: null,
        errorMessage: 'Request userId: ' + a.user.id,
        timestamp: f.clock(),
      },
    });
    await request(f, a);
    const r = await review(f, o, a);
    assert.equal((await finish(f, o, a, r.body.review)).status, 200);
    assert.equal((await finish(f, o, a, r.body.review)).status, 200);
    assert.equal(await f.prisma.user.findUnique({ where: { id: a.user.id } }), null);
    for (const model of ['identitySession', 'loginProof', 'token', 'trackPlay'])
      assert.equal(await f.prisma[model].count({ where: { userId: a.user.id } }), 0);
    const b = await f.prisma.billingCustomer.findUnique({
      where: { customerId: 'cus_purchase_1' },
    });
    assert.ok(b.deletedAt);
    assert.equal(b.userId, null);
    assert.equal(b.accessFreshUntil, null);
    const tombstone = await f.prisma.billingOperation.findUnique({
      where: { id: op.id },
    });
    assert.ok(tombstone.deletedAt);
    assert.equal(tombstone.externalId, op.externalId);
    assert.equal(tombstone.userId, null);
    assert.equal(tombstone.closureSubscriptionId, 'sub_purchase_1');
    assert.deepEqual(tombstone.parameters, {});
    assert.equal(tombstone.digest, '');
    const errors = await f.prisma.networkError.findMany({});
    assert.equal(errors.length, 3);
    for (const e of errors) {
      assert.equal(e.userId, null);
      assert.equal(e.userEmailAddress, null);
      assert.equal(e.errorCode, 503);
      assert.equal(e.errorType, null);
      assert.equal(e.errorMessage, 'Account details removed during deletion');
    }
    assert.deepEqual(await f.prisma.track.findUnique({ where: { id: 20 } }), track);
    assert.equal((await f.json('auth/verify', { token: proof })).status, 401);
    assert.equal((await f.request('auth/session', { headers: { Cookie: a.cookie } })).status, 401);
    assert.equal(f.stripe.resources.subscriptions[0].status, 'canceled');
  });
  test('D9: late duplicate events and same-email signup cannot adopt deleted customer', async () => {
    const f = fixture(),
      { a, o } = await setup(f);
    await f.start(a.cookie);
    const op = await f.operation(a.user.id);
    f.complete(op.externalId, { status: 'canceled' });
    await request(f, a);
    const r = await review(f, o, a);
    await finish(f, o, a, r.body.review);
    const replacement = await buyer(f, a.user.email);
    assert.notEqual(replacement.user.id, a.user.id);
    await f.notify(op.externalId);
    await f.notify(op.externalId);
    assert.equal(await f.customer(replacement.user.id), null);
    assert.equal((await f.confirm(replacement.cookie, op.externalId)).status, 403);
    await f.start(replacement.cookie);
    const next = await f.operation(replacement.user.id);
    f.complete(next.externalId);
    f.stripe.resources.sessions[1].customer = 'cus_purchase_1';
    f.stripe.resources.subscriptions[1].customer = 'cus_purchase_1';
    assert.equal(
      (await f.confirm(replacement.cookie, next.externalId)).body.reason,
      'customer_conflict'
    );
    assert.equal(await f.customer(replacement.user.id), null);
  });
  test('D9: suspended paid cache fill crossing completion cannot repopulate deleted binding', async () => {
    const f = fixture(),
      { a, o } = await setup(f);
    await f.start(a.cookie);
    const op = await f.operation(a.user.id);
    const e = f.complete(op.externalId);
    await f.notify(op.externalId);
    const hold = gate(),
      original = f.stripe.invoices.list;
    f.stripe.invoices.list = async (...args) => {
      const result = await original(...args);
      hold.arrive();
      await hold.wait;
      return result;
    };
    const playing = f.play(a.cookie);
    try {
      await hold.arrived;
      await request(f, a);
      e.sub.status = 'canceled';
      assert.equal((await finish(f, o, a, (await review(f, o, a)).body.review)).status, 200);
      hold.release();
      assert.ok((await playing).status >= 400);
      assert.equal(
        (
          await f.prisma.billingCustomer.findUnique({
            where: { customerId: 'cus_purchase_1' },
          })
        ).accessFreshUntil,
        null
      );
      assert.equal(f.signatures.length, 0);
    } finally {
      hold.release();
      f.stripe.invoices.list = original;
      await playing;
    }
  });
}
module.exports = {
  deletionCases,
  owner,
  setup,
  review,
  action,
  request,
  finish,
  gate,
};
