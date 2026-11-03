const createAccessFixture = require('./paid-access-http');
const { config, event } = require('./billing-provider');
const { postEvent } = require('./paid-access-cases');
module.exports = async function purchaseFixture(options = {}) {
  const f = await createAccessFixture({ ...options, select: false });
  f.signup = (email = 'new@example.invalid') =>
    f.json('user/synthetic-public-key', { firstName: 'New', lastName: 'Account', email });
  f.start = (cookie) => f.json('payment/checkout/synthetic-public-key', {}, cookie);
  f.confirm = (cookie, sessionId) =>
    f.json('payment/checkout-session-object/synthetic-public-key', { sessionId }, cookie);
  f.summary = (cookie) =>
    f.request('payment/account/synthetic-public-key', { headers: { Cookie: cookie, 'X-RVDL-CSRF': '1' } });
  f.me = async (cookie) => (await f.request('auth/session', { headers: { Cookie: cookie } })).body.user;
  f.operation = async (userId) =>
    (
      await f.prisma.billingOperation.findMany({
        where: { userId, kind: 'checkout' },
        orderBy: { createdAt: 'desc' },
      })
    ).find((row) => row.activeKey);
  f.customer = async (userId) => f.prisma.billingCustomer.findUnique({ where: { userId } });
  f.complete = (sessionId, { invoice = true, payment = 'paid', status = 'active' } = {}) => {
    const s = f.stripe.resources.sessions.find((row) => row.id === sessionId);
    if (!s) throw Error('Missing fake Checkout');
    const suffix = sessionId.slice('cs_test_'.length);
    const customerId = s.customer || 'cus_purchase_' + suffix;
    if (!f.stripe.resources.customers.some((c) => c.id === customerId))
      f.stripe.resources.customers.push({ id: customerId, object: 'customer', livemode: false });
    const time = Math.floor(f.clock().getTime() / 1000);
    const evidence = f.stripe.paidInvoice({
      key: 'purchase_' + suffix,
      customerId,
      subscriptionId: 'sub_purchase_' + suffix,
      from: time - 60,
      settled: time - 30,
      through: time + 86400,
      status,
    });
    if (!invoice)
      f.stripe.resources.invoices.splice(f.stripe.resources.invoices.indexOf(evidence.invoice), 1);
    Object.assign(s, {
      customer: customerId,
      subscription: evidence.sub.id,
      status: 'complete',
      payment_status: payment,
      amount_total: 1000,
      currency: config.currency,
      line_items: { data: [{ quantity: 1, price: evidence.sub.items.data[0].price }], has_more: false },
      url: null,
    });
    return evidence;
  };
  f.completedEvent = (sessionId) => {
    const object = f.stripe.resources.sessions.find((s) => s.id === sessionId);
    return { ...event('checkout.session.completed', sessionId), data: { object: structuredClone(object) } };
  };
  f.notify = (sessionId) => postEvent(f, f.completedEvent(sessionId));
  return f;
};
