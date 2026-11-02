const { webhooks } = require('stripe');
const config = {
  priceId: 'price_test_monthly',
  productId: 'prod_test_archive',
  currency: 'usd',
  livemode: false,
};
const epoch = Math.floor(new Date('2026-10-17T16:00:00Z').getTime() / 1000);
function provider(calls = []) {
  const resources = Object.fromEntries(
    [
      'customers',
      'subscriptions',
      'invoices',
      'paymentIntents',
      'charges',
      'refunds',
      'disputes',
      'sessions',
      'schedules',
      'lines',
    ].map((k) => [k, []])
  );
  const keys = new Map();
  const copy = (v) => structuredClone(v);
  const record =
    (name, fn) =>
    async (...args) => {
      calls.push('stripe.' + name);
      return copy(await fn(...args));
    };
  const retrieve = (key) =>
    record(key + '.retrieve', (id) => {
      const value = resources[key].find((r) => r.id === id);
      if (!value) throw new Error('Synthetic provider resource absent');
      return value;
    });
  const list = (key) =>
    record(key + '.list', (params) => {
      let rows = resources[key].filter((r) =>
        ['customer', 'subscription', 'charge', 'invoice', 'status'].every(
          (k) => !params[k] || (params[k] === 'all' && k === 'status') || r[k] === params[k]
        )
      );
      if (key === 'invoices' && params.status === 'paid')
        rows = [...rows].sort((a, b) => b.created - a.created);
      if (params.starting_after) {
        const at = rows.findIndex((r) => r.id === params.starting_after);
        if (at < 0) throw new Error('Synthetic cursor absent');
        rows = rows.slice(at + 1);
      }
      const limit = params.limit || 100;
      return { object: 'list', data: rows.slice(0, limit), has_more: rows.length > limit };
    });
  const stripe = { webhooks, resources, config };
  for (const key of [
    'customers',
    'subscriptions',
    'invoices',
    'paymentIntents',
    'charges',
    'refunds',
    'disputes',
  ])
    stripe[key] = { retrieve: retrieve(key), list: list(key) };
  stripe.customers.create = record('customers.create', (params, options) => {
    if (keys.has(options?.idempotencyKey)) return keys.get(options.idempotencyKey);
    const value = {
      id:
        'cus_test_new' +
        (resources.customers.some((c) => c.id === 'cus_test_new') ? resources.customers.length : ''),
      object: 'customer',
      livemode: false,
      ...params,
    };
    resources.customers.push(value);
    keys.set(options?.idempotencyKey, value);
    return value;
  });
  stripe.customers.update = record('customers.update', () => ({}));
  stripe.invoices.listLineItems = (invoiceId, params) => list('lines')({ ...params, invoice: invoiceId });
  stripe.subscriptionSchedules = { list: list('schedules') };
  stripe.checkout = {
    sessions: {
      list: list('sessions'),
      retrieve: retrieve('sessions'),
      create: record('checkout.create', (params, options) => {
        if (keys.has(options?.idempotencyKey)) return keys.get(options.idempotencyKey);
        const value = {
          id: 'cs_test_' + (resources.sessions.length + 1),
          object: 'checkout.session',
          url: 'https://checkout.stripe.com/c/pay/cs_test_' + (resources.sessions.length + 1),
          ...params,
          livemode: false,
          status: 'open',
        };
        resources.sessions.push(value);
        keys.set(options?.idempotencyKey, value);
        return value;
      }),
    },
  };
  stripe.paymentMethods = { attach: record('paymentMethods.attach', () => ({ id: 'pm_test_a' })) };
  stripe.billingPortal = {
    sessions: {
      create: record('portal.create', (params) => ({ id: 'bps_test', customer: params.customer, url: 'https://billing.stripe.com/p/session/synthetic' })),
    },
  };
  stripe.reset = () => {
    for (const values of Object.values(resources)) values.length = 0;
    keys.clear();
    for (const suffix of ['a', 'b', 'admin'])
      resources.customers.push({ id: 'cus_test_' + suffix, livemode: false, metadata: {} });
  };
  stripe.paidInvoice = ({
    key = 'first',
    subscriptionId = 'sub_test_a',
    customerId = 'cus_test_a',
    from = epoch - 3600,
    through = epoch + 86400,
    settled = from,
    created = from,
    status = 'active',
  } = {}) => {
    const price = {
      id: config.priceId,
      product: config.productId,
      currency: 'usd',
      recurring: { interval: 'month', interval_count: 1 },
    };
    let sub = resources.subscriptions.find((s) => s.id === subscriptionId);
    if (!sub) {
      sub = {
        id: subscriptionId,
        object: 'subscription',
        customer: customerId,
        livemode: false,
        status,
        collection_method: 'charge_automatically',
        created,
        start_date: created,
        cancel_at_period_end: false,
        canceled_at: null,
        ended_at: null,
        schedule: null,
        pending_update: null,
        trial_start: null,
        trial_end: null,
        discount: null,
        discounts: [],
        pause_collection: null,
        items: { data: [{ id: 'si_' + key, quantity: 1, price }], has_more: false },
      };
      resources.subscriptions.push(sub);
    }
    const invoice = {
      id: 'in_' + key,
      object: 'invoice',
      created,
      customer: customerId,
      subscription: subscriptionId,
      livemode: false,
      status: 'paid',
      paid: true,
      total: 1000,
      subtotal: 1000,
      amount_due: 1000,
      amount_paid: 1000,
      amount_remaining: 0,
      currency: 'usd',
      billing_reason: 'subscription_cycle',
      collection_method: 'charge_automatically',
      paid_out_of_band: false,
      starting_balance: 0,
      ending_balance: 0,
      pre_payment_credit_notes_amount: 0,
      post_payment_credit_notes_amount: 0,
      discount: null,
      discounts: [],
      total_discount_amounts: [],
      next_payment_attempt: null,
      status_transitions: { finalized_at: settled, paid_at: settled },
      payment_intent: 'pi_' + key,
      charge: 'ch_' + key,
    };
    resources.invoices.push(invoice);
    sub.latest_invoice = invoice.id;
    const line = {
      id: 'il_' + key,
      object: 'line_item',
      livemode: false,
      invoice: invoice.id,
      subscription: sub.id,
      type: 'subscription',
      proration: false,
      quantity: 1,
      price,
      amount: 1000,
      currency: 'usd',
      period: { start: from, end: through },
      discount_amounts: [],
    };
    resources.lines.push(line);
    invoice.lines = { object: 'list', data: [line], has_more: false };
    const payment = {
      id: 'pi_' + key,
      object: 'payment_intent',
      invoice: invoice.id,
      customer: customerId,
      livemode: false,
      currency: 'usd',
      amount: 1000,
      amount_received: 1000,
      status: 'succeeded',
      latest_charge: 'ch_' + key,
    };
    resources.paymentIntents.push(payment);
    const charge = {
      id: 'ch_' + key,
      object: 'charge',
      invoice: invoice.id,
      customer: customerId,
      payment_intent: payment.id,
      livemode: false,
      currency: 'usd',
      amount: 1000,
      amount_captured: 1000,
      amount_refunded: 0,
      status: 'succeeded',
      paid: true,
      captured: true,
      disputed: false,
      refunded: false,
    };
    resources.charges.push(charge);
    return { invoice, sub, line, payment, charge };
  };
  stripe.reset();
  return stripe;
}
function event(type, objectId, eventId = 'evt_' + require('node:crypto').randomUUID().replaceAll('-', '')) {
  return {
    id: eventId,
    object: 'event',
    type,
    api_version: '2024-12-18.acacia',
    livemode: false,
    created: epoch,
    data: {
      object: {
        id: objectId,
        object: type.startsWith('invoice.')
          ? 'invoice'
          : type.startsWith('customer.subscription.')
          ? 'subscription'
          : type.startsWith('charge.dispute.')
          ? 'dispute'
          : type.startsWith('charge.')
          ? 'charge'
          : 'customer',
      },
    },
  };
}
module.exports = { provider, config, epoch, event };
