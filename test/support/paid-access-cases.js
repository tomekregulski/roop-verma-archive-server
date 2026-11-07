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
function pauseSubscription(f) {
  let entered, release;
  const arrived = new Promise((resolve) => {
    entered = resolve;
  });
  const released = new Promise((resolve) => {
    release = resolve;
  });
  const original = f.stripe.subscriptions.retrieve;
  f.stripe.subscriptions.retrieve = async (...args) => {
    const snapshot = await original(...args);
    f.stripe.subscriptions.retrieve = original;
    entered();
    await released;
    return snapshot;
  };
  return {
    arrived,
    release,
    restore: () => {
      f.stripe.subscriptions.retrieve = original;
    },
  };
}

function paidAccessCases({ test, fixture }) {
  test('cold playback reads only the selected subscription; hot cache and public playback need no reads', async () => {
    const f = fixture();
    f.stripe.paidInvoice();
    const cookie = await f.login();
    f.calls.length = 0;
      assert.equal((await f.play(cookie)).status, 200);
      assert.deepEqual(reads(f), ['stripe.subscriptions.retrieve']);
      const before = await f.binding();
      for (let i = 0; i < 8; i++) assert.equal((await f.play(cookie)).status, 200);
      assert.equal(reads(f).length, 1);
      assert.equal(
        (await f.binding()).accessFreshUntil.getTime(),
        before.accessFreshUntil.getTime()
      );
      f.calls.length = 0;
      assert.equal((await f.json('track/10/playback-access/synthetic-public-key', {})).status, 200);
      assert.deepEqual(reads(f), []);
  });

  const invalid = {
    trial: (p) => {
      p.sub.status = 'trialing';
    },
    unpaid: (p) => {
      p.sub.status = 'unpaid';
    },
    incomplete: (p) => {
      p.sub.status = 'incomplete';
    },
    expired: (p) => {
      p.sub.status = 'incomplete_expired';
    },
    paused: (p) => {
      p.sub.status = 'paused';
    },
    canceled: (p) => {
      p.sub.status = 'canceled';
    },
    unknown: (p) => {
      p.sub.status = 'future';
    },
    missing: (p) => {
      delete p.sub.status;
    },
    malformed: (p) => {
      p.sub.status = ['active'];
    },
    'wrong customer': (p) => {
      p.sub.customer = 'cus_test_b';
    },
    'wrong mode': (p) => {
      p.sub.livemode = true;
    },
    'wrong price': (p) => {
      p.sub.items.data[0].price.id = 'price_foreign';
    },
    'wrong product': (p) => {
      p.sub.items.data[0].price.product = 'prod_foreign';
    },
    'wrong currency': (p) => {
      p.sub.items.data[0].price.currency = 'eur';
    },
    'extra item': (p) => {
      p.sub.items.data.push({ ...p.sub.items.data[0] });
    },
    'truncated items': (p) => {
      p.sub.items.has_more = true;
    },
    'string quantity': (p) => {
      p.sub.items.data[0].quantity = '1';
    },
    'string interval count': (p) => {
      p.sub.items.data[0].price.recurring.interval_count = '1';
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
            ['stripe.subscriptions.retrieve'].includes(call)
          )
        );
        assert.equal((await f.binding()).accessFreshUntil, null);
      }
    );
  }

  test('aggregate listens increment atomically without identity, duration or playback authority', async () => {
    const f = fixture();
    await f.prisma.track.update({ where: { id: 20 }, data: { plays: null } });
    const before = await f.prisma.track.findUnique({ where: { id: 10 } });
    const results = await Promise.all(
      Array.from({ length: 32 }, () =>
        f.json('track/20/listen/synthetic-public-key', {})
      )
    );
    assert.ok(results.every((r) => r.status === 204));
    assert.equal(
      (await f.prisma.track.findUnique({ where: { id: 20 } })).plays,
      32
    );
    assert.deepEqual(
      await f.prisma.track.findUnique({ where: { id: 10 } }),
      before
    );
    assert.equal((await f.play()).status, 401);
    assert.equal(f.signatures.length, 0);
    assert.equal('trackPlay' in f.prisma, false);
    assert.equal('networkError' in f.prisma, false);
  });
  test('aggregate input, CSRF, origin and key guards reject without increments', async () => {
    const f = fixture();
    const before = await f.prisma.track.findUnique({ where: { id: 20 } });
    for (const id of ['0', '01', '-1', '2147483648', '1e1'])
      assert.equal(
        (await f.json('track/' + id + '/listen/synthetic-public-key', {}))
          .status,
        400
      );
    for (const body of [
      { userId: 1 },
      { secondsListened: 60 },
      { trackId: 10 },
      [],
      { plays: 100 },
    ])
      assert.equal(
        (await f.json('track/20/listen/synthetic-public-key', body)).status,
        400
      );
    assert.equal(
      (
        await f.json('track/20/listen/synthetic-public-key', {}, null, {
          'X-RVDL-CSRF': '',
        })
      ).status,
      403
    );
    assert.equal(
      (
        await f.json('track/20/listen/synthetic-public-key', {}, null, {
          Origin: 'https://evil.invalid',
        })
      ).status,
      403
    );
    assert.equal((await f.json('track/20/listen/wrong', {})).status, 403);
    assert.equal(
      (await f.json('track/20/listen/synthetic-public-key?userId=1', {}))
        .status,
      400
    );
    assert.equal(
      (await f.json('track/999/listen/synthetic-public-key', {})).status,
      404
    );
    assert.equal(
      (
        await f.json('track/track-play/synthetic-public-key', {
          userId: 1,
          trackId: 20,
          secondsListened: 3,
        })
      ).status,
      404
    );
    for (const method of ['GET', 'POST', 'PUT', 'DELETE'])
      assert.equal(
        (
          await f.request('network-error/synthetic-public-key', {
            method,
            ...(method === 'GET'
              ? {}
              : {
                  body: '{}',
                  headers: { 'Content-Type': 'application/json' },
                }),
          })
        ).status,
        404
      );
    assert.deepEqual(
      await f.prisma.track.findUnique({ where: { id: 20 } }),
      before
    );
  });
  test('aggregate rate limits reuse expiring keyed counters and never grant media', async () => {
    const f = fixture();
    for (let i = 0; i < 120; i++)
      assert.equal(
        (await f.json('track/10/listen/synthetic-public-key', {})).status,
        204
      );
    assert.equal(
      (await f.json('track/10/listen/synthetic-public-key', {})).status,
      429
    );
    f.advance(15 * 60 * 1000);
    assert.equal(
      (await f.json('track/10/listen/synthetic-public-key', {})).status,
      204
    );
    assert.equal(f.signatures.length, 0);
  });

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
    p.sub.status = 'unpaid';
    assert.equal((await f.play(cookie)).status, 403);
    p.sub.status = 'active';
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
    next.sub.status = 'unpaid';
    f.advance(1);
    // Deliberately leave the old cache columns in place: the key must bind it to
    // the previous selection even if a future writer forgets to clear those columns.
    await f.prisma.billingCustomer.update({
      where: { customerId: 'cus_test_a' },
      data: { selectedSubscriptionId: next.sub.id },
    });
    assert.equal((await f.play(cookie)).status, 403);
  });

  for (const status of ['active', 'past_due'])
    test(
      'status ' +
        status +
        ' allows without invoice settlement, amounts, history or a paid-period cap', async () => {
    const f = fixture(),
      p = f.stripe.paidInvoice({ through: epoch + 1 });
    p.sub.status = status;
    p.sub.cancel_at_period_end = true;
        p.sub.discount = { id: 'di_incidental' };
        p.sub.trial_end = epoch - 100;
        f.stripe.resources.invoices.length = 0;
        f.stripe.invoices.list = async () => {
          throw Error('invoice reads must be removed');
        };
    const cookie = await f.login();
    assert.equal((await f.play(cookie)).status, 200);
        f.advance(MAX_FRESHNESS_MS);
    assert.equal((await f.play(cookie)).status, 200);
        const row = await f.binding();
        assert.equal(row.cachedStatus, status);
        assert.equal(
          row.accessFreshUntil - row.accessCheckedAt,
          MAX_FRESHNESS_MS
        );
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
    assert.equal(reads(f).length, 1);
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
        'subscription',
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
    const original = f.stripe.subscriptions.retrieve,
      started = f.clock();
    f.stripe.subscriptions.retrieve = async (...args) => {
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
      f.stripe.subscriptions.retrieve = original;
    }
    await f.select();
    f.stripe.subscriptions.retrieve = async (...args) => {
      const rows = await original(...args);
      f.advance(MAX_FRESHNESS_MS);
      return rows;
    };
    try {
      assert.equal((await f.play(cookie)).status, 503);
      assert.equal((await f.binding()).accessFreshUntil, null);
    } finally {
      f.stripe.subscriptions.retrieve = original;
    }
  });

  test('concurrent same-process cold reads coalesce to two GETs', async () => {
    const f = fixture();
    f.stripe.paidInvoice();
    const gate = pauseSubscription(f);
    try {
      const work = Array.from({ length: 10 }, () => f.access().readEntitlement(1));
      await gate.arrived;
      gate.release();
      assert.ok((await Promise.all(work)).every((value) => value?.kind === 'subscription'
        ));
      assert.equal(reads(f).length, 1);
    } finally {
      gate.release();
      gate.restore();
    }
  });

  test('logout during mapping defeats fresh status evidence at the final signing boundary', async () => {
    const f = fixture();
    f.stripe.paidInvoice();
    const cookie = await f.login();
    f.mappingHook = () => f.json('auth/logout', {}, cookie);
    assert.equal((await f.play(cookie)).status, 401);
    assert.equal(f.signatures.length, 0);
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
    const next = f.stripe.paidInvoice({ key: 'replacement', subscriptionId: 'sub_replacement',
    });
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

  test('mapping across cache expiry refreshes and rechecks changed status before signing', async () => {
    const f = fixture(),
      p = f.stripe.paidInvoice(),
      cookie = await f.login();
    f.mappingHook = () => f.advance(MAX_FRESHNESS_MS);
    assert.equal((await f.play(cookie)).status, 200);
    assert.equal(reads(f).length, 2);
    await f.select();
    f.mappingHook = () => {
      f.advance(MAX_FRESHNESS_MS);
      p.sub.status = 'unpaid';
    };
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
    await f.prisma.user.update({ where: { id: 1 }, data: { stripeId: 'cus_changed' },
    });
    assert.equal((await f.play(cookie)).status, 503);
  });
}
module.exports = { paidAccessCases, reads, cancellation, postEvent,
  pauseSubscription,
};
