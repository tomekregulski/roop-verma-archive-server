// Identical behavioral cases run against synthetic storage and real PostgreSQL.
// Every entitlement comes from signed events or resource reconciliation.
const assert = require('node:assert/strict');
const { webhooks } = require('stripe');
const { event, epoch } = require('./billing-provider');
const { reconcileCustomer } = require('../../billing/reconcile');
module.exports = function billingCases({ test, fixture }) {
  const get = () => fixture();
  const rows = (f, model) => f.prisma[model].findMany({});
  async function send(f, type, objectId, options = {}) {
    const value = { ...event(type, objectId, options.eventId), ...options.envelope };
    const body = JSON.stringify(value);
    const signature = webhooks.generateTestHeaderString({
      payload: body,
      secret: 'whsec_synthetic_fixture_only',
    });
    return f.request('payment/webhooks', {
      method: 'POST',
      body,
      headers: { 'Content-Type': 'application/json', 'Stripe-Signature': signature },
    });
  }
  const playback = (f, cookie, track = 20) =>
    f.json(`track/${track}/playback-access/synthetic-public-key`, {}, cookie);
  async function denied(f, cookie, status = 403) {
    const count = f.signatures.length;
    assert.equal((await playback(f, cookie)).status, status);
    assert.equal(f.signatures.length, count, 'denied subscriber never reaches signer');
  }
  function refund(f, charge, amount) {
    charge.amount_refunded = amount;
    charge.refunded = amount === charge.amount;
    f.stripe.resources.refunds.push({
      id: 're_test',
      charge: charge.id,
      currency: charge.currency,
      amount,
      status: 'succeeded',
    });
  }
  function dispute(f, charge, status = 'needs_response') {
    charge.disputed = true;
    const d = { id: 'du_test', charge: charge.id, livemode: false, currency: charge.currency, status };
    f.stripe.resources.disputes.push(d);
    return d;
  }
  const reconcile = (f, opts = {}) =>
    reconcileCustomer({
      db: f.prisma,
      stripe: f.stripe,
      billing: f.billing,
      customerId: 'cus_test_a',
      apply: true,
      ...opts,
    });
  test('signed paid invoice persists original evidence and enables real-reader playback; public is independent', async () => {
    const f = get(),
      cookie = await f.login(),
      p = f.stripe.paidInvoice();
    await denied(f, cookie);
    assert.equal((await send(f, 'invoice.paid', p.invoice.id)).status, 200);
    const grants = await rows(f, 'paidInvoiceGrant');
    assert.equal(grants.length, 1);
    assert.equal(grants[0].serviceThrough.getTime(), p.line.period.end * 1000);
    assert.equal(grants[0].serviceFrom.getTime(), p.line.period.start * 1000);
    const providerCalls = f.calls.filter((c) => c.startsWith('stripe.')).length;
    assert.equal((await playback(f, cookie)).status, 200);
    assert.equal(
      f.calls.filter((c) => c.startsWith('stripe.')).length,
      providerCalls,
      'playback reads only local persisted evidence'
    );
    assert.equal(f.signatures.at(-1).asset.key, 'playback/track-20.mp3');
    const b = await f.prisma.billingCustomer.findUnique({ where: { customerId: 'cus_test_a' } });
    assert.ok(b.revision > 0);
    assert.equal((await playback(f, 'invalid-cookie', 10)).status, 200);
    assert.equal((await playback(f, await f.login('b@example.invalid'))).status, 403);
  });
  const invalid = {
    'active status without invoice': (p) => {
      p.invoice.status = 'open';
      p.invoice.paid = false;
    },
    'draft invoice': (p) => {
      p.invoice.status = 'draft';
    },
    'void invoice': (p) => {
      p.invoice.status = 'void';
    },
    'uncollectible invoice': (p) => {
      p.invoice.status = 'uncollectible';
    },
    'zero payment': (p) => {
      p.invoice.amount_paid = 0;
    },
    'out-of-band settlement': (p) => {
      p.invoice.paid_out_of_band = true;
    },
    'manual invoice': (p) => {
      p.invoice.billing_reason = 'manual';
    },
    'balance credit': (p) => {
      p.invoice.starting_balance = -100;
    },
    'credit note': (p) => {
      p.invoice.pre_payment_credit_notes_amount = 100;
    },
    discount: (p) => {
      p.invoice.discounts = ['di_test'];
    },
    'mixed settlement': (p) => {
      p.invoice.amount_due = 900;
    },
    'unfinalized invoice': (p) => {
      p.invoice.status_transitions.finalized_at = null;
    },
    'unreceived payment': (p) => {
      p.payment.amount_received = 1;
    },
    'requires-action payment': (p) => {
      p.payment.status = 'requires_action';
    },
    'processing payment': (p) => {
      p.payment.status = 'processing';
    },
    'uncaptured charge': (p) => {
      p.charge.captured = false;
    },
    'short capture': (p) => {
      p.charge.amount_captured = 1;
    },
    'foreign PaymentIntent': (p) => {
      p.payment.customer = 'cus_foreign';
    },
    'foreign Charge': (p) => {
      p.charge.customer = 'cus_foreign';
    },
    'foreign invoice subscription': (p) => {
      p.invoice.subscription = 'sub_foreign';
    },
    'wrong mode': (p) => {
      p.invoice.livemode = true;
    },
    'unknown price': (p) => {
      p.line.price = { ...p.line.price, id: 'price_foreign' };
    },
    'wrong product': (p) => {
      p.line.price = { ...p.line.price, product: 'prod_foreign' };
    },
    'wrong currency': (p) => {
      p.line.currency = 'eur';
    },
    proration: (p) => {
      p.line.proration = true;
    },
    'quantity two': (p) => {
      p.line.quantity = 2;
    },
    'reversed period': (p) => {
      p.line.period.end = p.line.period.start;
    },
    'future settlement': (p) => {
      p.invoice.status_transitions.paid_at = epoch + 1;
    },
    'invalid settlement': (p) => {
      p.invoice.status_transitions.paid_at = NaN;
    },
    trial: (p) => {
      p.sub.status = 'trialing';
      p.sub.trial_start = epoch - 100;
      p.sub.trial_end = epoch + 100;
    },
    schedule: (p) => {
      p.sub.schedule = 'sub_sched_test';
    },
    'collection pause': (p) => {
      p.sub.pause_collection = { behavior: 'void' };
    },
    'pending plan change': (p) => {
      p.sub.pending_update = {};
    },
  };
  for (const [name, change] of Object.entries(invalid))
    test('insufficient evidence: ' + name, async () => {
      const f = get(),
        cookie = await f.login(),
        p = f.stripe.paidInvoice();
      change(p);
      const response = await send(f, 'invoice.paid', p.invoice.id);
      assert.ok([200, 503].includes(response.status));
      assert.equal((await rows(f, 'paidInvoiceGrant')).length, 0);
      const receipt = (await rows(f, 'stripeEventReceipt'))[0];
      assert.ok(['pending', 'review'].includes(receipt.outcome));
      await denied(f, cookie);
    });
  test('all invoice line pages are fetched; extra adjustments cannot qualify', async () => {
    const f = get(),
      p = f.stripe.paidInvoice(),
      cookie = await f.login();
    f.stripe.resources.lines.push({ ...p.line, id: 'il_adjustment' });
    const original = f.stripe.invoices.listLineItems;
    f.stripe.invoices.listLineItems = (id, params) => original(id, { ...params, limit: 1 });
    try {
      assert.equal((await send(f, 'invoice.paid', p.invoice.id)).status, 200);
    } finally {
      f.stripe.invoices.listLineItems = original;
    }
    assert.equal((await rows(f, 'paidInvoiceGrant')).length, 0);
    await denied(f, cookie);
  });
  test('same and different event IDs, concurrent delivery and lost acknowledgement grant the invoice once', async () => {
    const f = get(),
      p = f.stripe.paidInvoice();
    const responses = await Promise.all(
      Array.from({ length: 8 }, (_, i) =>
        send(f, i % 2 ? 'invoice.payment_succeeded' : 'invoice.paid', p.invoice.id, {
          eventId: i < 3 ? 'evt_same' : 'evt_duplicate_' + i,
        })
      )
    );
    assert.ok(responses.every((r) => [200, 503].includes(r.status)));
    for (const receipt of await rows(f, 'stripeEventReceipt'))
      if (receipt.outcome === 'pending') await f.billing.replayReceipt(receipt);
    assert.equal((await send(f, 'invoice.paid', p.invoice.id, { eventId: 'evt_same' })).status, 200);
    const grants = await rows(f, 'paidInvoiceGrant');
    assert.equal(grants.length, 1);
    assert.equal(grants[0].serviceThrough.getTime(), p.line.period.end * 1000);
  });
  test('transaction failure leaves no partial subscription, grant, display or completed receipt; retry repairs', async () => {
    const f = get(),
      p = f.stripe.paidInvoice();
    await f.prisma.user.update({ where: { id: 1 }, data: { subscriptionActive: 'previous-display' } });
    const original = f.prisma.$transaction.bind(f.prisma);
    f.prisma.$transaction = (work, options) =>
      original(
        (tx) =>
          work(
            new Proxy(tx, {
              get(target, key) {
                if (key === 'paidInvoiceGrant')
                  return new Proxy(target[key], {
                    get(delegate, method) {
                      if (method === 'create')
                        return async () => {
                          throw new Error('synthetic write fault');
                        };
                      return delegate[method];
                    },
                  });
                return target[key];
              },
            })
          ),
        options
      );
    try {
      assert.equal((await send(f, 'invoice.paid', p.invoice.id, { eventId: 'evt_retry' })).status, 503);
    } finally {
      f.prisma.$transaction = original;
    }
    assert.equal((await rows(f, 'paidInvoiceGrant')).length, 0);
    assert.equal(
      (await rows(f, 'subscription')).some((s) => s.syncedAt),
      false
    );
    assert.equal((await rows(f, 'stripeEventReceipt'))[0].outcome, 'pending');
    assert.equal(
      (await f.prisma.user.findUnique({ where: { id: 1 } })).subscriptionActive,
      'previous-display'
    );
    assert.equal((await send(f, 'invoice.paid', p.invoice.id, { eventId: 'evt_retry' })).status, 200);
    assert.equal((await rows(f, 'paidInvoiceGrant')).length, 1);
  });
  test('provider timeout and truncated pages fail retryably without erasing existing coverage', async () => {
    const f = get(),
      cookie = await f.login(),
      p = f.stripe.paidInvoice();
    await send(f, 'invoice.paid', p.invoice.id);
    const original = f.stripe.invoices.listLineItems;
    f.stripe.invoices.listLineItems = async () => ({ data: [], has_more: true });
    try {
      assert.equal((await send(f, 'invoice.paid', p.invoice.id)).status, 503);
    } finally {
      f.stripe.invoices.listLineItems = original;
    }
    assert.equal((await playback(f, cookie)).status, 200);
    const retrieve = f.stripe.paymentIntents.retrieve;
    f.stripe.paymentIntents.retrieve = async () => {
      throw Error('synthetic timeout');
    };
    try {
      assert.equal((await send(f, 'invoice.paid', p.invoice.id)).status, 503);
    } finally {
      f.stripe.paymentIntents.retrieve = retrieve;
    }
  });
  test('reconciliation repairs missed events and missing projections independently of completed receipts', async () => {
    const f = get(),
      cookie = await f.login(),
      p = f.stripe.paidInvoice();
    const inspection = await reconcile(f, { apply: false });
    assert.equal(inspection.qualifying, 1);
    assert.equal((await rows(f, 'paidInvoiceGrant')).length, 0);
    await reconcile(f);
    assert.equal((await playback(f, cookie)).status, 200);
    await send(f, 'invoice.paid', p.invoice.id);
    await f.prisma.paidInvoiceGrant.deleteMany({});
    await reconcile(f);
    await reconcile(f);
    assert.equal((await rows(f, 'paidInvoiceGrant')).length, 1);
  });
  test('resumable reconciliation checkpoints only successful invoice pages', async () => {
    const f = get();
    f.stripe.paidInvoice({ key: 'one' });
    f.stripe.paidInvoice({ key: 'two' });
    const first = await reconcile(f, { limit: 1 });
    assert.equal(first.complete, false);
    assert.equal((await rows(f, 'paidInvoiceGrant')).length, 1);
    const original = f.stripe.invoices.retrieve;
    f.stripe.invoices.retrieve = async () => {
      throw Error('timeout');
    };
    try {
      await assert.rejects(reconcile(f, { limit: 1 }));
    } finally {
      f.stripe.invoices.retrieve = original;
    }
    const b = await f.prisma.billingCustomer.findUnique({ where: { customerId: 'cus_test_a' } });
    assert.equal(b.reconcileCursor, first.cursor);
    const last = await reconcile(f, { limit: 1 });
    assert.equal(last.complete, true);
    assert.equal((await rows(f, 'paidInvoiceGrant')).length, 2);
  });
  test('full refund permanently revokes only its interval; stale paid notifications cannot resurrect', async () => {
    const f = get(),
      cookie = await f.login(),
      p = f.stripe.paidInvoice();
    await send(f, 'invoice.paid', p.invoice.id);
    refund(f, p.charge, 1000);
    assert.equal((await send(f, 'charge.refunded', p.charge.id)).status, 200);
    await denied(f, cookie);
    // Even a faulty later snapshot claiming no refund must not clear terminal evidence.
    p.charge.amount_refunded = 0;
    p.charge.refunded = false;
    f.stripe.resources.refunds.length = 0;
    await send(f, 'invoice.paid', p.invoice.id);
    await denied(f, cookie);
    const other = f.stripe.paidInvoice({ key: 'other' });
    await send(f, 'invoice.paid', other.invoice.id);
    assert.equal((await playback(f, cookie)).status, 200);
  });
  test('partial refund creates review and preserves original coverage', async () => {
    const f = get(),
      cookie = await f.login(),
      p = f.stripe.paidInvoice();
    await send(f, 'invoice.paid', p.invoice.id);
    refund(f, p.charge, 200);
    await send(f, 'charge.refunded', p.charge.id);
    const grant = (await rows(f, 'paidInvoiceGrant'))[0];
    assert.equal(grant.reviewReason, 'PARTIAL_REFUND');
    assert.equal(grant.invalidatedAt, null);
    assert.equal((await playback(f, cookie)).status, 200);
  });
  test('open dispute holds; absent resolution cannot clear it; verified won/withdrawn restores original remainder only', async () => {
    const f = get(),
      cookie = await f.login(),
      p = f.stripe.paidInvoice();
    await send(f, 'invoice.paid', p.invoice.id);
    const d = dispute(f, p.charge);
    await send(f, 'charge.dispute.created', d.id);
    await denied(f, cookie);
    f.stripe.resources.disputes.length = 0;
    p.charge.disputed = false;
    await send(f, 'invoice.paid', p.invoice.id);
    await denied(f, cookie);
    d.status = 'warning_closed';
    f.stripe.resources.disputes.push(d);
    await send(f, 'charge.dispute.closed', d.id);
    await denied(f, cookie);
    d.status = 'won';
    await send(f, 'charge.dispute.closed', d.id);
    assert.equal((await playback(f, cookie)).status, 200);
    assert.equal((await rows(f, 'paidInvoiceGrant'))[0].serviceThrough.getTime(), p.line.period.end * 1000);
    f.advance(86400000);
    await denied(f, cookie);
  });
  test('lost dispute remains terminal and a full refund still vetoes a won dispute', async () => {
    const f = get(),
      cookie = await f.login(),
      p = f.stripe.paidInvoice();
    await send(f, 'invoice.paid', p.invoice.id);
    const d = dispute(f, p.charge, 'lost');
    await send(f, 'charge.dispute.closed', d.id);
    await denied(f, cookie);
    d.status = 'won';
    await send(f, 'charge.dispute.closed', d.id);
    await denied(f, cookie);
    const other = f.stripe.paidInvoice({ key: 'second' });
    refund(f, other.charge, 1000);
    f.stripe.resources.disputes.push({
      id: 'du_won',
      charge: other.charge.id,
      currency: 'usd',
      livemode: false,
      status: 'won',
    });
    await send(f, 'invoice.paid', other.invoice.id);
    await denied(f, cookie);
  });
  test('older fetch finishing last conflicts, refetches and cannot overwrite a newer refund', async () => {
    const f = get(),
      cookie = await f.login(),
      p = f.stripe.paidInvoice();
    const original = f.stripe.disputes.list;
    let entered, release;
    const ready = new Promise((r) => {
      entered = r;
    });
    const held = new Promise((r) => {
      release = r;
    });
    let block = true;
    f.stripe.disputes.list = async (...args) => {
      const snapshot = await original(...args);
      if (block) {
        block = false;
        entered();
        await held;
      }
      return snapshot;
    };
    const old = send(f, 'invoice.paid', p.invoice.id);
    await ready;
    refund(f, p.charge, 1000);
    assert.equal((await send(f, 'charge.refunded', p.charge.id)).status, 200);
    release();
    try {
      assert.equal((await old).status, 200, 'revision conflict must refetch consistent current resources');
    } finally {
      f.stripe.disputes.list = original;
    }
    await denied(f, cookie);
    assert.equal((await rows(f, 'paidInvoiceGrant')).length, 1);
  });
  test('cancellation preserves paid coverage; past_due has no grace; exact end denies', async () => {
    const f = get(),
      cookie = await f.login(),
      p = f.stripe.paidInvoice();
    await send(f, 'invoice.paid', p.invoice.id);
    p.sub.cancel_at_period_end = true;
    await send(f, 'customer.subscription.updated', p.sub.id);
    assert.equal((await playback(f, cookie)).status, 200);
    p.sub.status = 'past_due';
    await send(f, 'invoice.payment_failed', p.invoice.id);
    assert.equal((await playback(f, cookie)).status, 200);
    p.sub.status = 'canceled';
    p.sub.ended_at = epoch;
    p.sub.canceled_at = epoch;
    await send(f, 'customer.subscription.deleted', p.sub.id);
    assert.equal((await playback(f, cookie)).status, 200);
    f.advance(86400000);
    await denied(f, cookie);
  });
  test('incomplete/unpaid veto contradictory grants; recovery and stale failure use current state', async () => {
    const f = get(),
      cookie = await f.login(),
      p = f.stripe.paidInvoice();
    await send(f, 'invoice.paid', p.invoice.id);
    for (const status of ['incomplete', 'unpaid', 'incomplete_expired']) {
      p.sub.status = status;
      await send(f, 'customer.subscription.updated', p.sub.id);
      await denied(f, cookie);
    }
    p.sub.status = 'active';
    await send(f, 'invoice.payment_failed', p.invoice.id);
    assert.equal((await playback(f, cookie)).status, 200);
  });
  test('future and noncontiguous renewals never bridge unpaid gaps or add time', async () => {
    const f = get(),
      p = f.stripe.paidInvoice({ through: epoch + 1 }),
      cookie = await f.login();
    await send(f, 'invoice.paid', p.invoice.id);
    const future = f.stripe.paidInvoice({
      key: 'future',
      from: epoch + 5,
      through: epoch + 10,
      settled: epoch,
    });
    await send(f, 'invoice.paid', future.invoice.id);
    assert.equal((await playback(f, cookie)).status, 200);
    f.advance(1000);
    await denied(f, cookie);
    f.advance(4000);
    assert.equal((await playback(f, cookie)).status, 200);
    f.advance(5000);
    await denied(f, cookie);
  });
  test('late settlement begins at paid_at; expired historical payment never creates a new period', async () => {
    const f = get(),
      cookie = await f.login(),
      p = f.stripe.paidInvoice({ settled: epoch, from: epoch - 100 });
    await send(f, 'invoice.paid', p.invoice.id);
    assert.equal((await f.readEntitlement(1)).paidFrom.getTime(), epoch * 1000);
    f.advance(-1);
    await denied(f, cookie);
    f.advance(86400001);
    await denied(f, cookie);
    const old = f.stripe.paidInvoice({
      key: 'old',
      from: epoch - 1000,
      through: epoch - 100,
      settled: epoch,
    });
    await send(f, 'invoice.paid', old.invoice.id);
    await denied(f, cookie);
  });
  test('unexpected duplicate subscription is quarantined without harming established coverage or stacking', async () => {
    const f = get(),
      cookie = await f.login(),
      p = f.stripe.paidInvoice();
    await send(f, 'invoice.paid', p.invoice.id);
    const duplicate = f.stripe.paidInvoice({
      key: 'duplicate',
      subscriptionId: 'sub_duplicate',
      created: epoch,
      through: epoch + 900000,
    });
    await send(f, 'invoice.paid', duplicate.invoice.id);
    assert.equal((await rows(f, 'paidInvoiceGrant')).length, 1);
    assert.equal((await f.readEntitlement(1)).paidThrough.getTime(), p.line.period.end * 1000);
    assert.equal((await playback(f, cookie)).status, 200);
    p.sub.status = 'canceled';
    p.sub.ended_at = epoch;
    await send(f, 'customer.subscription.deleted', p.sub.id);
    await send(f, 'invoice.paid', duplicate.invoice.id);
    assert.equal((await rows(f, 'paidInvoiceGrant')).length, 1);
  });
  test('resubscription retains history; late old-sub deletion cannot delete the replacement', async () => {
    const f = get(),
      p = f.stripe.paidInvoice();
    await send(f, 'invoice.paid', p.invoice.id);
    p.sub.status = 'canceled';
    p.sub.ended_at = epoch - 10;
    await send(f, 'customer.subscription.deleted', p.sub.id);
    const replacement = f.stripe.paidInvoice({
      key: 'replacement',
      subscriptionId: 'sub_replacement',
      created: epoch,
    });
    await send(f, 'invoice.paid', replacement.invoice.id);
    await send(f, 'customer.subscription.deleted', p.sub.id);
    const subs = await rows(f, 'subscription');
    assert.ok(subs.find((s) => s.id === replacement.sub.id)?.acceptedAt);
    assert.ok(subs.find((s) => s.id === p.sub.id));
  });
  test('pending customer association retries and recovers without email reassignment', async () => {
    const f = get(),
      p = f.stripe.paidInvoice();
    await f.prisma.billingCustomer.deleteMany({ where: { customerId: 'cus_test_a' } });
    assert.equal((await send(f, 'invoice.paid', p.invoice.id, { eventId: 'evt_association' })).status, 503);
    assert.equal((await rows(f, 'paidInvoiceGrant')).length, 0);
    await f.prisma.billingCustomer.create({ data: { customerId: 'cus_test_a', userId: 1, livemode: false } });
    assert.equal((await send(f, 'invoice.paid', p.invoice.id, { eventId: 'evt_association' })).status, 200);
  });
  test('unsupported/missing versions, thin envelopes and foreign modes are durable exceptions', async () => {
    const f = get(),
      p = f.stripe.paidInvoice();
    for (const envelope of [
      { api_version: null },
      { api_version: '2026-01-01.other' },
      { livemode: true },
      { data: { object: { id: p.invoice.id } } },
    ])
      assert.equal((await send(f, 'invoice.paid', p.invoice.id, { envelope })).status, 200);
    assert.equal((await rows(f, 'paidInvoiceGrant')).length, 0);
    assert.ok((await rows(f, 'stripeEventReceipt')).every((r) => r.outcome === 'review'));
  });
  test('revocation committed during asset mapping is reread before signer', async () => {
    const f = get(),
      cookie = await f.login(),
      p = f.stripe.paidInvoice();
    await send(f, 'invoice.paid', p.invoice.id);
    f.mappingHook = async () => {
      refund(f, p.charge, 1000);
      await send(f, 'charge.refunded', p.charge.id);
    };
    try {
      await denied(f, cookie);
    } finally {
      f.mappingHook = null;
    }
  });
  test('account deletion stays pending on active or uncertain billing and prevents new Checkout', async () => {
    const f = get(),
      p = f.stripe.paidInvoice(),
      cookie = await f.login();
    await send(f, 'invoice.paid', p.invoice.id);
    await assert.rejects(f.operations.deleteAccount(1), (e) => e.status === 409);
    assert.equal((await playback(f, cookie)).status, 200);
    await assert.rejects(f.operations.checkout({ id: 1, stripeId: 'cus_test_a' }), (e) => e.status === 409);
    const original = f.stripe.subscriptions.list;
    f.stripe.subscriptions.list = async () => ({ data: [], has_more: true });
    try {
      await assert.rejects(f.operations.deleteAccount(1));
    } finally {
      f.stripe.subscriptions.list = original;
    }
    assert.ok(await f.prisma.user.findUnique({ where: { id: 1 } }));
  });
  for (const reason of [
    'open invoice',
    'open Checkout',
    'future schedule',
    'unexpected subscription',
    'retry',
  ])
    test('deletion rejects ' + reason + ' even with ended main subscription', async () => {
      const f = get(),
        p = f.stripe.paidInvoice();
      p.sub.status = 'canceled';
      p.sub.ended_at = epoch;
      if (reason === 'open invoice') p.invoice.status = 'open';
      if (reason === 'open Checkout')
        f.stripe.resources.sessions.push({
          id: 'cs_open',
          customer: 'cus_test_a',
          livemode: false,
          mode: 'subscription',
          status: 'open',
        });
      if (reason === 'future schedule')
        f.stripe.resources.schedules.push({
          id: 'sub_sched_test',
          customer: 'cus_test_a',
          livemode: false,
          status: 'not_started',
        });
      if (reason === 'unexpected subscription')
        f.stripe.paidInvoice({ key: 'other', subscriptionId: 'sub_other' });
      if (reason === 'retry') p.invoice.next_payment_attempt = epoch + 100;
      await assert.rejects(f.operations.deleteAccount(1), (e) => e.status === 409);
      assert.ok(await f.prisma.user.findUnique({ where: { id: 1 } }));
    });
  test('confirmed closure atomically deletes identity, retains billing tombstone/history and never recreates account', async () => {
    const f = get(),
      cookie = await f.login(),
      p = f.stripe.paidInvoice();
    await send(f, 'invoice.paid', p.invoice.id);
    p.sub.status = 'canceled';
    p.sub.ended_at = epoch;
    await f.operations.deleteAccount(1);
    await denied(f, cookie, 401);
    const b = await f.prisma.billingCustomer.findUnique({ where: { customerId: 'cus_test_a' } });
    assert.equal(b.userId, null);
    assert.ok(b.deletedAt);
    assert.equal((await rows(f, 'paidInvoiceGrant')).length, 1);
    await send(f, 'customer.created', 'cus_test_a');
    await send(f, 'invoice.paid', p.invoice.id);
    assert.equal(await f.prisma.user.findUnique({ where: { id: 1 } }), null);
    assert.equal((await rows(f, 'paidInvoiceGrant')).length, 1);
  });
  test('simultaneous Checkout routes reuse a durable reservation and one owned session', async () => {
    const f = get(),
      user = { id: 1, stripeId: 'cus_test_a' };
    const sessions = await Promise.all(Array.from({ length: 5 }, () => f.operations.checkout(user)));
    assert.equal(new Set(sessions.map((s) => s.id)).size, 1);
    assert.equal((await rows(f, 'checkoutOwnership')).length, 1);
    assert.equal(f.stripe.resources.sessions.length, 1);
    assert.equal((await rows(f, 'billingOperation')).length, 1);
  });
  test('recorded legacy unfinished Checkout is reused without another provider creation', async () => {
    const f = get();
    f.stripe.resources.sessions.push({
      id: 'cs_legacy',
      customer: 'cus_test_a',
      livemode: false,
      status: 'open',
      mode: 'subscription',
    });
    await f.prisma.checkoutOwnership.create({
      data: { sessionId: 'cs_legacy', userId: 1, customerId: 'cus_test_a' },
    });
    const session = await f.operations.checkout({ id: 1, stripeId: 'cus_test_a' });
    assert.equal(session.id, 'cs_legacy');
    assert.equal(f.stripe.resources.sessions.length, 1);
    assert.equal(f.calls.includes('stripe.checkout.create'), false);
  });
  test('expired idempotency window never releases an unresolved creation or creates a new Checkout', async () => {
    const f = get(),
      original = f.stripe.checkout.sessions.create;
    f.stripe.checkout.sessions.create = async () => {
      throw Error('uncertain provider outcome');
    };
    try {
      await assert.rejects(f.operations.checkout({ id: 1, stripeId: 'cus_test_a' }));
    } finally {
      f.stripe.checkout.sessions.create = original;
    }
    f.advance(24 * 3600000);
    await assert.rejects(f.operations.checkout({ id: 1, stripeId: 'cus_test_a' }), (e) => e.status === 409);
    assert.equal(f.stripe.resources.sessions.length, 0);
    await assert.rejects(f.operations.deleteAccount(1), (e) => e.status === 409);
  });
  test('receipt persistence outage never acknowledges or retrieves payment resources', async () => {
    const f = get(),
      p = f.stripe.paidInvoice(),
      original = f.prisma.stripeEventReceipt.upsert;
    f.prisma.stripeEventReceipt.upsert = async () => {
      throw Error('receipt store unavailable');
    };
    f.calls.length = 0;
    try {
      assert.equal((await send(f, 'invoice.paid', p.invoice.id)).status, 500);
    } finally {
      f.prisma.stripeEventReceipt.upsert = original;
    }
    assert.equal(
      f.calls.some((c) => c.startsWith('stripe.')),
      false
    );
    assert.equal((await rows(f, 'paidInvoiceGrant')).length, 0);
  });
  test('reconciliation repairs inconsistent lifecycle and a resolved hold through current provider evidence', async () => {
    const f = get(),
      p = f.stripe.paidInvoice();
    await send(f, 'invoice.paid', p.invoice.id);
    const d = dispute(f, p.charge);
    await send(f, 'charge.dispute.created', d.id);
    await f.prisma.subscription.update({ where: { id: p.sub.id }, data: { status: 'unpaid' } });
    d.status = 'won';
    await reconcile(f);
    assert.ok(await f.readEntitlement(1));
    assert.equal((await rows(f, 'paidInvoiceGrant')).length, 1);
  });
  test('inconsistent original period becomes a retained exception and cannot extend playback', async () => {
    const f = get(),
      p = f.stripe.paidInvoice();
    await send(f, 'invoice.paid', p.invoice.id);
    p.line.period.end += 86400;
    await reconcile(f);
    const grant = (await rows(f, 'paidInvoiceGrant'))[0];
    assert.equal(grant.serviceThrough.getTime(), (p.line.period.end - 86400) * 1000);
    assert.equal(grant.invalidationReason, 'EVIDENCE_CONFLICT');
    assert.equal(await f.readEntitlement(1), null);
  });
  test('deletion closure fetched before a newer billing commit must refetch and retain the account', async () => {
    const f = get(),
      p = f.stripe.paidInvoice();
    p.sub.status = 'canceled';
    p.sub.ended_at = epoch;
    await send(f, 'invoice.paid', p.invoice.id);
    const original = f.stripe.invoices.list;
    let entered,
      release,
      block = true;
    const ready = new Promise((r) => {
        entered = r;
      }),
      held = new Promise((r) => {
        release = r;
      });
    f.stripe.invoices.list = async (...args) => {
      const snapshot = await original(...args);
      if (block) {
        block = false;
        entered();
        await held;
      }
      return snapshot;
    };
    const deletion = f.operations.deleteAccount(1);
    await ready;
    p.sub.status = 'active';
    p.sub.ended_at = null;
    assert.equal((await send(f, 'customer.subscription.updated', p.sub.id)).status, 200);
    release();
    try {
      await assert.rejects(deletion, (e) => e.status === 409);
    } finally {
      f.stripe.invoices.list = original;
    }
    assert.ok(await f.prisma.user.findUnique({ where: { id: 1 } }));
  });
  test('thin or unsupported-version receipts cannot grant when replayed by recovery', async () => {
    const f = get(),
      p = f.stripe.paidInvoice();
    await send(f, 'invoice.paid', p.invoice.id, { envelope: { data: { object: { id: p.invoice.id } } } });
    for (const receipt of await rows(f, 'stripeEventReceipt')) await f.billing.replayReceipt(receipt);
    assert.equal((await rows(f, 'paidInvoiceGrant')).length, 0);
  });
  test('signed primitive and malformed envelopes become durable exceptions without resource work', async () => {
    const f = get();
    f.calls.length = 0;
    for (const body of ['null', '[]', '{"type":123}']) {
      const response = await f.request('payment/webhooks', {
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
      assert.equal(response.status, 200);
    }
    assert.ok(
      (await rows(f, 'stripeEventReceipt')).every(
        (r) => r.outcome === 'review' && r.errorCode === 'MALFORMED_ENVELOPE'
      )
    );
    assert.equal(
      f.calls.some((c) => c.startsWith('stripe.')),
      false
    );
  });
  test('valid signed snapshots remain bounded by the unchanged raw-body size limit', async () => {
    const f = get(),
      p = f.stripe.paidInvoice();
    const payload = (size) =>
      JSON.stringify({
        ...event('invoice.paid', p.invoice.id),
        metadata: { synthetic_padding: 'x'.repeat(size) },
      });
    const post = (body) =>
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
    assert.equal((await post(payload(14000))).status, 200);
    const count = (await rows(f, 'stripeEventReceipt')).length;
    assert.equal((await post(payload(17000))).status, 413);
    assert.equal((await rows(f, 'stripeEventReceipt')).length, count);
  });
  test('operation reconciliation recovers registration without another provider POST', async () => {
    const f = get(),
      original = f.prisma.$transaction;
    f.prisma.$transaction = async () => {
      throw Error('post-provider crash');
    };
    try {
      await assert.rejects(
        f.operations.register({ email: 'recover@example.invalid', firstName: 'Recover', lastName: 'Test' })
      );
    } finally {
      f.prisma.$transaction = original;
    }
    const writes = f.calls.filter((c) => c === 'stripe.customers.create').length;
    assert.equal((await f.operations.recoverPending()).recoverable, 1);
    assert.equal(
      (await rows(f, 'user')).some((u) => u.email === 'recover@example.invalid'),
      false
    );
    assert.equal((await f.operations.recoverPending({ apply: true })).applied, 1);
    assert.equal(f.calls.filter((c) => c === 'stripe.customers.create').length, writes);
    assert.equal((await rows(f, 'billingOperation'))[0].state, 'completed');
  });
  test('operation reconciliation recovers an externally created Checkout after ownership rollback', async () => {
    const f = get(),
      original = f.prisma.$transaction.bind(f.prisma);
    f.prisma.$transaction = (work, options) =>
      original(
        (tx) =>
          work(
            new Proxy(tx, {
              get(target, key) {
                if (key === 'checkoutOwnership')
                  return new Proxy(target[key], {
                    get(delegate, method) {
                      if (method === 'upsert')
                        return async () => {
                          throw Error('ownership rollback');
                        };
                      return delegate[method];
                    },
                  });
                return target[key];
              },
            })
          ),
        options
      );
    try {
      await assert.rejects(f.operations.checkout({ id: 1, stripeId: 'cus_test_a' }));
    } finally {
      f.prisma.$transaction = original;
    }
    assert.equal(f.stripe.resources.sessions.length, 1);
    assert.equal((await rows(f, 'checkoutOwnership')).length, 0);
    assert.equal((await f.operations.recoverPending({ apply: true })).applied, 1);
    assert.equal((await rows(f, 'checkoutOwnership')).length, 1);
    assert.equal(
      (await f.operations.checkout({ id: 1, stripeId: 'cus_test_a' })).id,
      f.stripe.resources.sessions[0].id
    );
    assert.equal(f.stripe.resources.sessions.length, 1);
  });
  test('previously unseen overlapping canceled subscriptions cannot both become paid coverage', async () => {
    const f = get(),
      first = f.stripe.paidInvoice({ status: 'canceled', created: epoch - 3600 });
    first.sub.ended_at = epoch;
    const second = f.stripe.paidInvoice({
      key: 'overlap',
      subscriptionId: 'sub_overlap',
      status: 'canceled',
      created: epoch - 1800,
      through: epoch + 900000,
    });
    second.sub.ended_at = epoch;
    await send(f, 'invoice.paid', first.invoice.id);
    await send(f, 'invoice.paid', second.invoice.id);
    const grants = await rows(f, 'paidInvoiceGrant');
    assert.equal(grants.length, 1);
    assert.equal(grants[0].invoiceId, first.invoice.id);
  });
  test('tampered pending-operation parameters cannot change a provider POST', async () => {
    const f = get(),
      original = f.stripe.checkout.sessions.create;
    f.stripe.checkout.sessions.create = async () => {
      throw Error('initial interrupted call');
    };
    try {
      await assert.rejects(f.operations.checkout({ id: 1, stripeId: 'cus_test_a' }));
    } finally {
      f.stripe.checkout.sessions.create = original;
    }
    const op = (await rows(f, 'billingOperation'))[0];
    await f.prisma.billingOperation.update({
      where: { id: op.id },
      data: { parameters: { ...op.parameters, customer: 'cus_foreign' } },
    });
    await assert.rejects(f.operations.checkout({ id: 1, stripeId: 'cus_test_a' }));
    assert.equal(f.stripe.resources.sessions.length, 0);
    assert.equal((await f.operations.recoverPending({ apply: true })).failures, 1);
  });
  test('known customer mapping corruption is durable review and playback authority is unavailable', async () => {
    const f = get(),
      cookie = await f.login(),
      p = f.stripe.paidInvoice();
    await send(f, 'invoice.paid', p.invoice.id);
    await f.prisma.user.update({ where: { id: 1 }, data: { stripeId: 'cus_corrupted_mapping' } });
    assert.equal((await send(f, 'invoice.paid', p.invoice.id)).status, 200);
    assert.ok(
      (await rows(f, 'stripeEventReceipt')).some(
        (r) => r.outcome === 'review' && r.errorCode === 'MAPPING_CONFLICT'
      )
    );
    await denied(f, cookie, 503);
  });
  test('persisted test/live evidence cannot authorize playback in a different configured environment', async () => {
    const f = get(),
      cookie = await f.login(),
      p = f.stripe.paidInvoice();
    await send(f, 'invoice.paid', p.invoice.id);
    await f.prisma.billingCustomer.update({ where: { customerId: 'cus_test_a' }, data: { livemode: true } });
    await denied(f, cookie, 503);
    assert.equal((await send(f, 'invoice.paid', p.invoice.id)).status, 200);
    assert.ok((await rows(f, 'stripeEventReceipt')).some((r) => r.errorCode === 'BINDING_MODE_CONFLICT'));
  });
  test('registration retry after provider success persists one app-owned account and association', async () => {
    const f = get();
    const original = f.prisma.$transaction;
    f.prisma.$transaction = async () => {
      throw Error('storage fault after provider create');
    };
    const parameters = { firstName: 'New', lastName: 'Listener', email: 'new@example.invalid' };
    try {
      await assert.rejects(f.operations.register(parameters));
    } finally {
      f.prisma.$transaction = original;
    }
    assert.equal(f.stripe.resources.customers.filter((c) => c.metadata?.billing_operation).length, 1);
    const customerId = await f.operations.register(parameters);
    assert.ok(await f.prisma.billingCustomer.findUnique({ where: { customerId } }));
    assert.equal(f.stripe.resources.customers.filter((c) => c.metadata?.billing_operation).length, 1);
    assert.equal((await rows(f, 'user')).filter((u) => u.email === parameters.email).length, 1);
  });
};
