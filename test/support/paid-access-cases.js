const assert = require('node:assert/strict');
const { webhooks } = require('stripe');
const { event, epoch } = require('./billing-provider');
const { MAX_FRESHNESS_MS } = require('../../billing/paid-access');

const reads = (f) => f.calls.filter((call) => call.startsWith('stripe.'));
function cancellation(subscription, eventId) {
  return {
    ...event('customer.subscription.deleted', subscription.id, eventId),
    data: { object: { ...subscription, status: 'canceled' } },
  };
}
async function postEvent(f, value, signature = true) {
  const body = JSON.stringify(value);
  return f.request('payment/webhooks', {
    method: 'POST',
    body,
    headers: {
      'Content-Type': 'application/json',
      ...(signature
        ? {
            'Stripe-Signature': webhooks.generateTestHeaderString({
              payload: body,
              secret: 'whsec_synthetic_fixture_only',
            }),
          }
        : {}),
    },
  });
}
function pauseInvoice(f) {
  let entered, release;
  const arrived = new Promise((resolve) => {
    entered = resolve;
  });
  const released = new Promise((resolve) => {
    release = resolve;
  });
  const original = f.stripe.invoices.list;
  f.stripe.invoices.list = async (...args) => {
    const snapshot = await original(...args);
    entered();
    await released;
    return snapshot;
  };
  return {
    arrived,
    release,
    restore: () => {
      f.stripe.invoices.list = original;
    },
  };
}

function paidAccessCases({ test, fixture }) {
  test('cold HTTP playback uses two GETs; hot requests and signing recheck use zero more; public uses none', async () => {
    const f = fixture(),
      p = f.stripe.paidInvoice(),
      cookie = await f.login();
    const requested = [];
    const original = f.stripe.invoices.list;
    f.stripe.invoices.list = async (params) => {
      requested.push(params);
      return original(params);
    };
    try {
      f.calls.length = 0;
      assert.equal((await f.play(cookie)).status, 200);
      assert.deepEqual(reads(f), ['stripe.subscriptions.retrieve', 'stripe.invoices.list']);
      assert.deepEqual(requested, [
        { customer: 'cus_test_a', subscription: p.sub.id, status: 'paid', limit: 1 },
      ]);
      const before = await f.binding();
      for (let i = 0; i < 8; i++) assert.equal((await f.play(cookie)).status, 200);
      assert.equal(reads(f).length, 2);
      assert.equal(
        (await f.binding()).accessFreshUntil.getTime(),
        before.accessFreshUntil.getTime()
      );
      f.calls.length = 0;
      assert.equal((await f.json('track/10/playback-access/synthetic-public-key', {})).status, 200);
      assert.deepEqual(reads(f), []);
      assert.equal('paidInvoiceGrant' in f.prisma, false, 'no financial grant delegate remains');
    } finally {
      f.stripe.invoices.list = original;
    }
  });

  const invalid = {
    'active but unpaid': (p) => {
      p.invoice.status = 'open';
      p.invoice.paid = false;
    },
    trial: (p) => {
      p.sub.status = 'trialing';
    },
    'unpaid lifecycle': (p) => {
      p.sub.status = 'unpaid';
    },
    'incomplete lifecycle': (p) => {
      p.sub.status = 'incomplete';
    },
    'unknown lifecycle': (p) => {
      p.sub.status = 'future_unknown';
    },
    'collection pause': (p) => {
      p.sub.pause_collection = { behavior: 'void' };
    },
    'manual collection': (p) => {
      p.sub.collection_method = 'send_invoice';
    },
    schedule: (p) => {
      p.sub.schedule = 'sub_sched_unsupported';
    },
    'wrong customer': (p) => {
      p.invoice.customer = 'cus_test_b';
    },
    'wrong invoice mode': (p) => {
      p.invoice.livemode = true;
    },
    'wrong subscription mode': (p) => {
      p.sub.livemode = true;
    },
    'wrong price': (p) => {
      p.line.price.id = 'price_foreign';
    },
    'wrong product': (p) => {
      p.line.price.product = 'prod_foreign';
    },
    'wrong currency': (p) => {
      p.invoice.currency = 'eur';
    },
    'zero cost': (p) => {
      p.invoice.total = p.invoice.amount_paid = p.invoice.amount_due = p.line.amount = 0;
    },
    'customer credit': (p) => {
      p.invoice.starting_balance = -1000;
    },
    'out of band': (p) => {
      p.invoice.paid_out_of_band = true;
    },
    discount: (p) => {
      p.invoice.discounts = ['di_unsupported'];
    },
    'credit used before payment': (p) => {
      p.invoice.pre_payment_credit_notes_amount = 1000;
    },
    'line credit': (p) => {
      p.line.pretax_credit_amounts = [{ amount: 1000 }];
    },
    proration: (p) => {
      p.line.proration = true;
    },
    'missing paid declaration': (p) => {
      delete p.invoice.paid;
    },
    'missing out-of-band declaration': (p) => {
      delete p.invoice.paid_out_of_band;
    },
    'missing starting balance': (p) => {
      delete p.invoice.starting_balance;
    },
    'missing ending balance': (p) => {
      delete p.invoice.ending_balance;
    },
    'missing pre-payment credit amount': (p) => {
      delete p.invoice.pre_payment_credit_notes_amount;
    },
    'missing proration declaration': (p) => {
      delete p.line.proration;
    },
    'string quantity': (p) => {
      p.line.quantity = '1';
    },
    'string interval count': (p) => {
      p.line.price.recurring.interval_count = '1';
    },
    'malformed discounts': (p) => {
      p.invoice.discounts = {};
    },
    'truncated lines': (p) => {
      p.invoice.lines.has_more = true;
    },
    'extra line': (p) => {
      p.invoice.lines.data.push({ ...p.line, id: 'il_extra' });
    },
    'foreign line': (p) => {
      p.line.subscription = 'sub_foreign';
    },
    'reversed period': (p) => {
      p.line.period.end = p.line.period.start;
    },
    'expired period': (p) => {
      p.line.period.end = epoch;
    },
    'future payment': (p) => {
      p.invoice.status_transitions.paid_at = epoch + 1;
    },
    'unfinalized payment': (p) => {
      p.invoice.status_transitions.finalized_at = null;
    },
  };
  for (const [name, change] of Object.entries(invalid)) {
    test(
      'paid-access qualifier denies ' + name + ' without signing or extra financial reads',
      async () => {
        const f = fixture(),
          p = f.stripe.paidInvoice();
        change(p);
        const cookie = await f.login();
        f.calls.length = 0;
        assert.ok([403, 503].includes((await f.play(cookie)).status));
        assert.equal(f.signatures.length, 0);
        assert.ok(reads(f).length <= 2);
        assert.ok(
          reads(f).every((call) =>
            ['stripe.subscriptions.retrieve', 'stripe.invoices.list'].includes(call)
          )
        );
        assert.equal((await f.binding()).accessFreshUntil, null);
      }
    );
  }

  test('unselected binding and foreign verified user cannot borrow cached access', async () => {
    const f = fixture();
    f.stripe.paidInvoice();
    const cookie = await f.login(),
      other = await f.login('b@example.invalid');
    assert.equal((await f.play(cookie)).status, 200);
    assert.equal((await f.play(other)).status, 403);
    await f.select({ selectedSubscriptionId: null });
    f.calls.length = 0;
    assert.equal((await f.play(cookie)).status, 403);
    assert.deepEqual(reads(f), []);
  });

  test('no negative caching: corrected supported payment can be read on the next attempt', async () => {
    const f = fixture(),
      p = f.stripe.paidInvoice(),
      cookie = await f.login();
    p.invoice.status = 'open';
    assert.equal((await f.play(cookie)).status, 403);
    p.invoice.status = 'paid';
    f.advance(1);
    assert.equal((await f.play(cookie)).status, 200);
  });

  test('a changed selection cannot inherit a still-fresh cached interval', async () => {
    const f = fixture();
    f.stripe.paidInvoice();
    const cookie = await f.login();
    assert.equal((await f.play(cookie)).status, 200);
    const next = f.stripe.paidInvoice({
      key: 'unpaid_replacement',
      subscriptionId: 'sub_unpaid_replacement',
    });
    next.invoice.status = 'open';
    f.advance(1);
    // Deliberately leave the old cache columns in place: the key must bind it to
    // the previous selection even if a future writer forgets to clear those columns.
    await f.prisma.billingCustomer.update({
      where: { customerId: 'cus_test_a' },
      data: { selectedSubscriptionId: next.sub.id },
    });
    assert.equal((await f.play(cookie)).status, 403);
  });

  test('late payment, failed renewal and scheduled cancellation preserve only the original remaining period', async () => {
    const f = fixture(),
      p = f.stripe.paidInvoice({ settled: epoch - 30, through: epoch + 60 });
    p.sub.status = 'past_due';
    p.sub.cancel_at_period_end = true;
    const next = f.stripe.paidInvoice({
      key: 'unpaid_renewal',
      created: epoch,
      from: epoch + 60,
      through: epoch + 86400,
    });
    next.invoice.status = 'open';
    const cookie = await f.login();
    assert.equal((await f.play(cookie)).status, 200);
    const stored = await f.binding();
    assert.equal(stored.cachedPaidFrom.getTime(), (epoch - 30) * 1000);
    assert.equal(stored.accessFreshUntil.getTime(), (epoch + 60) * 1000);
    f.advance(60000);
    assert.equal((await f.play(cookie)).status, 403);
  });

  test('latest unsupported/future paid invoice does not trigger historical search or stack coverage', async () => {
    const f = fixture();
    f.stripe.paidInvoice();
    f.stripe.paidInvoice({ key: 'future', created: epoch, from: epoch + 3600, settled: epoch - 1 });
    const cookie = await f.login();
    f.calls.length = 0;
    assert.equal((await f.play(cookie)).status, 403);
    assert.equal(reads(f).length, 2);
  });

  test('refund-only and dispute events neither revoke nor restore: only canceled state vetoes', async () => {
    const f = fixture(),
      p = f.stripe.paidInvoice(),
      cookie = await f.login();
    assert.equal((await f.play(cookie)).status, 200);
    p.charge.refunded = true;
    p.charge.amount_refunded = 1000;
    // Stripe can document a refund on an already-paid invoice with a credit
    // note. It does not undo the original positive payment under D4/D5.
    p.invoice.post_payment_credit_notes_amount = 1000;
    for (const type of [
      'charge.refunded',
      'charge.dispute.created',
      'charge.dispute.closed',
      'invoice.paid',
    ])
      assert.equal((await postEvent(f, event(type, p.charge.id))).status, 200);
    f.advance(MAX_FRESHNESS_MS);
    f.calls.length = 0;
    assert.equal((await f.play(cookie)).status, 200);
    assert.equal(reads(f).length, 2);
    assert.equal((await f.binding()).selectedCanceledAt, null);
  });

  test('fresh shared cache survives provider outage and adapter restart, but expiry has no stale-on-error extension', async () => {
    const f = fixture();
    f.stripe.paidInvoice();
    const cookie = await f.login();
    assert.equal((await f.play(cookie)).status, 200);
    const stored = await f.binding(),
      original = f.stripe.subscriptions.retrieve;
    f.stripe.subscriptions.retrieve = async () => {
      f.calls.push('stripe.subscriptions.retrieve');
      throw Error('offline');
    };
    try {
      f.restartAccess();
      assert.equal(
        (await f.access().readEntitlement(1)).kind,
        'paid',
        'a new adapter instance reuses only the shared cache'
      );
      f.calls.length = 0;
      assert.equal((await f.play(cookie)).status, 200);
      assert.deepEqual(reads(f), []);
      f.advance(MAX_FRESHNESS_MS);
      assert.equal((await f.play(cookie)).status, 503);
      assert.equal(
        (await f.binding()).accessFreshUntil.getTime(),
        stored.accessFreshUntil.getTime()
      );
      await f.select();
      assert.equal((await f.play(cookie)).status, 503, 'cold cache cannot authorize offline');
    } finally {
      f.stripe.subscriptions.retrieve = original;
    }
  });

  test('freshness starts before reads; slow and repeated fills never slide its deadline', async () => {
    const f = fixture();
    f.stripe.paidInvoice();
    const cookie = await f.login();
    const original = f.stripe.invoices.list,
      started = f.clock();
    f.stripe.invoices.list = async (...args) => {
      const rows = await original(...args);
      f.advance(30000);
      return rows;
    };
    try {
      assert.equal((await f.play(cookie)).status, 200);
      const row = await f.binding();
      assert.equal(row.accessCheckedAt.getTime(), started.getTime());
      assert.equal(row.accessFreshUntil.getTime(), started.getTime() + MAX_FRESHNESS_MS);
    } finally {
      f.stripe.invoices.list = original;
    }
    await f.select();
    f.stripe.invoices.list = async (...args) => {
      const rows = await original(...args);
      f.advance(MAX_FRESHNESS_MS);
      return rows;
    };
    try {
      assert.equal((await f.play(cookie)).status, 503);
      assert.equal((await f.binding()).accessFreshUntil, null);
    } finally {
      f.stripe.invoices.list = original;
    }
  });

  test('concurrent same-process cold reads coalesce to two GETs', async () => {
    const f = fixture();
    f.stripe.paidInvoice();
    const gate = pauseInvoice(f);
    try {
      const work = Array.from({ length: 10 }, () => f.access().readEntitlement(1));
      await gate.arrived;
      gate.release();
      assert.ok((await Promise.all(work)).every((value) => value?.kind === 'paid'));
      assert.equal(reads(f).length, 2);
    } finally {
      gate.release();
      gate.restore();
    }
  });

  test('signed cancellation during mapping beats cached access; duplicates/paid events cannot clear it', async () => {
    const f = fixture(),
      p = f.stripe.paidInvoice(),
      cookie = await f.login();
    const notification = cancellation(p.sub);
    f.mappingHook = async () => {
      assert.equal((await postEvent(f, notification)).status, 200);
    };
    assert.equal((await f.play(cookie)).status, 403);
    assert.equal(f.signatures.length, 0);
    const canceledAt = (await f.binding()).selectedCanceledAt.getTime();
    f.advance(1);
    assert.equal((await postEvent(f, notification)).status, 200);
    assert.equal(
      (await postEvent(f, event('customer.subscription.updated', p.sub.id))).status,
      200
    );
    assert.equal((await postEvent(f, event('invoice.paid', p.invoice.id))).status, 200);
    assert.equal((await f.binding()).selectedCanceledAt.getTime(), canceledAt);
    assert.equal(await f.access().readEntitlement(1), null);
    assert.equal(
      'stripeEventReceipt' in f.prisma,
      false,
      'terminal veto needs no financial event ledger'
    );
  });

  test('old subscription cancellation cannot veto a securely selected replacement', async () => {
    const f = fixture(),
      p = f.stripe.paidInvoice();
    assert.equal((await postEvent(f, cancellation(p.sub))).status, 200);
    const next = f.stripe.paidInvoice({ key: 'replacement', subscriptionId: 'sub_replacement' });
    await f.select({ selectedSubscriptionId: next.sub.id });
    assert.equal((await postEvent(f, cancellation(p.sub))).status, 200);
    const cookie = await f.login();
    assert.equal((await f.play(cookie)).status, 200);
    assert.equal((await f.binding()).selectedCanceledAt, null);
  });

  test('missed cancellation resolves on expiry with one GET and stays denied after restart/offline', async () => {
    const f = fixture(),
      p = f.stripe.paidInvoice(),
      cookie = await f.login();
    assert.equal((await f.play(cookie)).status, 200);
    p.sub.status = 'canceled';
    f.advance(MAX_FRESHNESS_MS - 1);
    assert.equal((await f.play(cookie)).status, 200, 'approved bounded cache delay');
    f.advance(1);
    f.calls.length = 0;
    assert.equal((await f.play(cookie)).status, 403);
    assert.deepEqual(reads(f), ['stripe.subscriptions.retrieve']);
    f.restartAccess();
    f.calls.length = 0;
    assert.equal((await f.play(cookie)).status, 403);
    assert.deepEqual(reads(f), []);
  });

  test('mapping across cache expiry refreshes; mapping across paid end never signs', async () => {
    const f = fixture();
    f.stripe.paidInvoice();
    const cookie = await f.login();
    f.mappingHook = () => f.advance(MAX_FRESHNESS_MS);
    assert.equal((await f.play(cookie)).status, 200);
    assert.equal(reads(f).length, 4);
    await f.select();
    f.mappingHook = () => f.advance(1000);
    const p = f.stripe.resources.invoices[0];
    p.lines.data[0].period.end = Math.floor(f.clock() / 1000) + 1;
    const count = f.signatures.length;
    assert.equal((await f.play(cookie)).status, 403);
    assert.equal(f.signatures.length, count);
  });

  test('unsigned/unsupported/foreign-mode terminal envelopes never install a veto', async () => {
    const f = fixture(),
      p = f.stripe.paidInvoice(),
      value = cancellation(p.sub);
    assert.equal((await postEvent(f, value, false)).status, 400);
    for (const change of [
      (v) => {
        v.api_version = 'unsupported';
      },
      (v) => {
        v.livemode = true;
      },
      (v) => {
        v.data.object.status = 'active';
      },
      (v) => {
        v.data.object = { id: p.sub.id };
      },
    ]) {
      const invalid = structuredClone(value);
      change(invalid);
      assert.equal((await postEvent(f, invalid)).status, 503);
      assert.equal((await f.binding()).selectedCanceledAt, null);
    }
    assert.deepEqual(reads(f), []);
  });

  test('local database failure and mapping corruption cannot be bypassed by a fresh cache', async () => {
    const f = fixture();
    f.stripe.paidInvoice();
    const cookie = await f.login();
    assert.equal((await f.play(cookie)).status, 200);
    const original = f.prisma.billingCustomer.findUnique;
    f.prisma.billingCustomer.findUnique = async () => {
      throw Error('db offline');
    };
    try {
      assert.equal((await f.play(cookie)).status, 503);
    } finally {
      f.prisma.billingCustomer.findUnique = original;
    }
    await f.prisma.user.update({ where: { id: 1 }, data: { stripeId: 'cus_changed' } });
    assert.equal((await f.play(cookie)).status, 503);
  });
}
module.exports = { paidAccessCases, reads, cancellation, postEvent, pauseInvoice };
