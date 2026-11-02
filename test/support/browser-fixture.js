// Standalone browser-test fixture. Never imported by app.js/index.js.
const http = require('node:http');
const createFixture = require('./identity-http');
module.exports = async function browserFixture({
  clientOrigin = 'http://127.0.0.1:3000',
  apiPort = 8090,
  controlPort = 8091,
  fixtureFactory = createFixture,
  db,
  clearDatabase,
  purchaseMode = false,
} = {}) {
  if (process.env.NODE_ENV === 'production') throw new Error('Synthetic fixture refuses production');
  const fixture = await fixtureFactory({
    db,
    port: apiPort,
    configuration: { CLIENT_URL: clientOrigin, SESSION_COOKIE_SECURE: 'false' },
  });
  if (clearDatabase) await clearDatabase();
  const baseline = Date.parse('2026-10-17T16:00:00Z');
  fixture.advance(Date.now() - baseline);
  if (!purchaseMode) fixture.prisma.track = { findMany: async () => [] };
  let webhookMode = 'delayed';
  let sequence = 0;
  const createUser = fixture.prisma.user.create;
  fixture.prisma.user.create = (args) =>
    createUser({
      ...args,
      data: {
        ...(db ? {} : { id: 100 + sequence }),
        subscriptionActive: null,
        ...args.data,
      },
    });
  let timers = [];
  const requests = [];
  // Record only method/path/origin/header-presence/status. Never bodies/cookies/proofs.
  fixture.server.prependListener('request', (req, res) => {
    const path = new URL(req.url, 'http://fixture.invalid').pathname;
    res.on('finish', () =>
      requests.push({
        method: req.method,
        path,
        origin: req.headers.origin ?? null,
        csrf: req.headers['x-rvdl-csrf'] === '1',
        cookie: Boolean(req.headers.cookie?.includes('rv-session-local=')),
        status: res.statusCode,
      })
    );
  });
  const createCustomer = fixture.stripe.customers.create;
  fixture.stripe.customers.create = async (params) => {
    await createCustomer(params);
    const id = 'cus_browser_' + ++sequence;
    if (webhookMode === 'delayed') {
      timers.push(
        setTimeout(async () => {
          const payload = JSON.stringify({
            id: 'evt_browser_' + sequence,
            type: 'customer.created',
            data: { object: { id, ...params } },
          });
          const signature = fixture.stripe.webhooks.generateTestHeaderString({
            payload,
            secret: 'whsec_synthetic_fixture_only',
          });
          await fetch(fixture.origin + '/api/v1/payment/webhooks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Stripe-Signature': signature },
            body: payload,
          });
        }, 10000)
      );
    }
    return { id };
  };
  const createPortal = fixture.stripe.billingPortal.sessions.create;
  if (!purchaseMode)
    fixture.stripe.billingPortal.sessions.create = async (params) => ({
      ...(await createPortal(params)),
      url: 'http://127.0.0.1:' + controlPort + '/portal',
    });
  const controls = http.createServer((req, res) => {
    void handleControl(req, res).catch(() => {
      res.writeHead(500).end('Synthetic control failed');
    });
  });
  async function handleControl(req, res) {
    res.setHeader('Cache-Control', 'no-store');
    const url = new URL(req.url, 'http://fixture.invalid');
    if (req.method === 'GET' && url.pathname === '/state') {
      // Browser checks may read sanitized metadata, never captured credentials.
      res.setHeader('Access-Control-Allow-Origin', clientOrigin);
      res.setHeader('Content-Type', 'application/json');
      res.end(
        JSON.stringify({
          requests,
          mailCount: fixture.mail.length,
          sessions: await fixture.prisma.identitySession.count(),
          calls: fixture.calls.filter((call) => call.startsWith('stripe.')),
          users: (await fixture.prisma.user.findMany({})).map((user) => user.email),
          checkoutCount: fixture.stripe.resources.sessions.length,
          bindingCount: await fixture.prisma.billingCustomer.count(),
        })
      );
      return;
    }
    if (req.method === 'GET' && url.pathname === '/open-latest') {
      const mail = fixture.mail.at(-1);
      if (!mail) {
        res.writeHead(404).end('No synthetic mail captured');
        return;
      }
      res.writeHead(302, { Location: mail.link }).end();
      return;
    }
    if (
      req.method === 'POST' &&
      url.pathname === '/control' &&
      (!req.headers.origin || req.headers.origin === 'http://127.0.0.1:' + controlPort)
    ) {
      const action = url.searchParams.get('action');
      if (action === 'reset') {
        timers.forEach(clearTimeout);
        timers = [];
        await fixture.reset();
        if (clearDatabase) await clearDatabase();
        fixture.advance(Date.now() - baseline);
        requests.length = 0;
      }
      if (purchaseMode && ['pay', 'return-only', 'pending-payment', 'missed-return'].includes(action)) {
        const sessionId = url.searchParams.get('session');
        fixture.complete(sessionId, { payment: action === 'pending-payment' ? 'unpaid' : 'paid' });
        if (action !== 'return-only') await fixture.notify(sessionId);
        res
          .writeHead(303, {
            Location:
              action === 'missed-return'
                ? clientOrigin + '/manage-account'
                : clientOrigin +
                  '/complete-registration?success=true&session_id=' +
                  encodeURIComponent(sessionId),
          })
          .end();
        return;
      }
      if (purchaseMode && action === 'settle') {
        const session = fixture.stripe.resources.sessions.at(-1);
        session.payment_status = 'paid';
        await fixture.notify(session.id);
      }
      if (purchaseMode && action === 'expire-checkout')
        fixture.stripe.resources.sessions.at(-1).status = 'expired';
      if (purchaseMode && action === 'unknown-old') {
        const operation = (
          await fixture.prisma.billingOperation.findMany({
            where: { kind: 'checkout' },
            orderBy: { createdAt: 'desc' },
            take: 1,
          })
        )[0];
        await fixture.prisma.billingOperation.update({
          where: { id: operation.id },
          data: { externalId: null, createdAt: new Date(Date.now() - 24 * 3600000) },
        });
      }
      if (purchaseMode && action === 'owner-login') {
        let user = await fixture.prisma.user.findUnique({ where: { email: 'owner@example.invalid' } });
        if (!user) user = await fixture.prisma.user.create({ data: { email: 'owner@example.invalid', firstName: 'Synthetic', lastName: 'Owner', stripeId: null, isAdmin: true } });
        await fixture.json('auth/login', { email: user.email });
        res.writeHead(303, { Location: '/open-latest' }).end();
        return;
      }
      if (purchaseMode && action === 'close-subscriptions')
        for (const sub of fixture.stripe.resources.subscriptions) sub.status = 'canceled';
      if (action === 'restore-mail') fixture.failMail(false);
      if (action === 'expire-proof') fixture.advance(16 * 60 * 1000);
      if (action === 'expire-session') fixture.advance(8 * 24 * 60 * 60 * 1000);
      if (action === 'revoke')
        await fixture.prisma.identitySession.updateMany({
          where: { revokedAt: null },
          data: { revokedAt: new Date() },
        });
      if (action === 'missing-webhook') webhookMode = 'missing';
      if (action === 'delayed-webhook') webhookMode = 'delayed';
      if (action === 'fail-mail') fixture.failMail();
      res.writeHead(303, { Location: purchaseMode ? clientOrigin + '/manage-account' : '/' }).end();
      return;
    }
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.end(`<!doctype html><title>Synthetic identity harness</title><h1>Synthetic identity harness</h1>
      <p>Local test only. ${
        purchaseMode ? 'Disposable PostgreSQL' : 'In-memory database'
      }, fake mail and Stripe; no external services.</p>
      <a href="${clientOrigin}">Open React app</a> · <a href="/open-latest">Open latest synthetic email link</a> · <a href="${clientOrigin}/__identity-checks">Run browser contract checks</a>
      ${[
        'reset',
        'expire-proof',
        'expire-session',
        'revoke',
        'missing-webhook',
        'delayed-webhook',
        'fail-mail',
        ...(purchaseMode ? ['settle', 'expire-checkout', 'unknown-old', 'owner-login', 'close-subscriptions', 'restore-mail'] : []),
      ]
        .map(
          (action) =>
            `<form method="post" action="/control?action=${action}"><button>${action}</button></form>`
        )
        .join('')}
      ${
        url.pathname === '/portal'
          ? `<h2>Fake hosted portal</h2><a href="${clientOrigin}/manage-account">Return to account</a>`
          : ''
      }
      ${
        url.pathname === '/checkout'
          ? `<h2>Fake hosted Checkout</h2>${
              purchaseMode
                ? ['pay', 'return-only', 'pending-payment', 'missed-return']
                    .map(
                      (action) =>
                        `<form method="post" action="/control?action=${action}&session=${encodeURIComponent(
                          url.searchParams.get('session') ?? ''
                        )}"><button>${action}</button></form>`
                    )
                    .join('')
                : `<a href="${clientOrigin}/complete-registration?success=true&session_id=${encodeURIComponent(
                    url.searchParams.get('session') ?? ''
                  )}">Return from Checkout</a>`
            }<a href="${clientOrigin}/manage-account">Leave Checkout unfinished</a>`
          : ''
      }`);
  }
  try {
    await new Promise((resolve, reject) => {
      controls.once('error', reject);
      controls.listen(controlPort, '127.0.0.1', resolve);
    });
  } catch (error) {
    await fixture.close();
    throw error;
  }
  return {
    fixture,
    close: async () => {
      timers.forEach(clearTimeout);
      await new Promise((resolve) => controls.close(resolve));
      await fixture.close();
    },
  };
};
