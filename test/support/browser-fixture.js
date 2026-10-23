// Standalone browser-test fixture. Never imported by app.js/index.js.
const http = require('node:http');
const createFixture = require('./identity-http');
module.exports = async function browserFixture({ clientOrigin = 'http://127.0.0.1:3000', apiPort = 8090, controlPort = 8091 } = {}) {
  if (process.env.NODE_ENV === 'production') throw new Error('Synthetic fixture refuses production');
  const fixture = await createFixture({ port: apiPort, configuration: { CLIENT_URL: clientOrigin, SESSION_COOKIE_SECURE: 'false' } });
  const baseline = Date.parse('2026-10-17T16:00:00Z');
  fixture.advance(Date.now() - baseline);
  fixture.prisma.track = { findMany: async () => [] };
  let webhookMode = 'delayed';
  let sequence = 0;
  const createUser = fixture.prisma.user.create;
  fixture.prisma.user.create = args => createUser({ ...args, data: {
    id: 100 + sequence, subscriptionActive: null, ...args.data,
  } });
  let timers = [];
  const requests = [];
  // Record only method/path/origin/header-presence/status. Never bodies/cookies/proofs.
  fixture.server.prependListener('request', (req, res) => {
    const path = new URL(req.url, 'http://fixture.invalid').pathname;
    res.on('finish', () => requests.push({ method: req.method, path, origin: req.headers.origin ?? null,
      csrf: req.headers['x-rvdl-csrf'] === '1', cookie: Boolean(req.headers.cookie?.includes('rv-session-local=')), status: res.statusCode }));
  });
  const createCustomer = fixture.stripe.customers.create;
  fixture.stripe.customers.create = async params => {
    await createCustomer(params);
    const id = 'cus_browser_' + (++sequence);
    if (webhookMode === 'delayed') {
      timers.push(setTimeout(async () => {
        const payload = JSON.stringify({ id: 'evt_browser_' + sequence, type: 'customer.created', data: { object: { id, ...params } } });
        const signature = fixture.stripe.webhooks.generateTestHeaderString({ payload, secret: 'whsec_synthetic_fixture_only' });
        await fetch(fixture.origin + '/api/v1/payment/webhooks', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Stripe-Signature': signature }, body: payload });
      }, 10000));
    }
    return { id };
  };
  const createPortal = fixture.stripe.billingPortal.sessions.create;
  fixture.stripe.billingPortal.sessions.create = async params => ({ ...await createPortal(params), url: 'http://127.0.0.1:' + controlPort + '/portal' });
  const controls = http.createServer(async (req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    const url = new URL(req.url, 'http://fixture.invalid');
    if (req.method === 'GET' && url.pathname === '/state') {
      // Browser checks may read sanitized metadata, never captured credentials.
      res.setHeader('Access-Control-Allow-Origin', clientOrigin);
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ requests, mailCount: fixture.mail.length, sessions: fixture.prisma.tables.identitySession.length,
        calls: fixture.calls.filter(call => call.startsWith('stripe.')), users: fixture.prisma.tables.user.map(user => user.email) })); return;
    }
    if (req.method === 'GET' && url.pathname === '/open-latest') {
      const mail = fixture.mail.at(-1);
      if (!mail) { res.writeHead(404).end('No synthetic mail captured'); return; }
      res.writeHead(302, { Location: mail.link }).end(); return;
    }
    if (req.method === 'POST' && url.pathname === '/control' && (!req.headers.origin || req.headers.origin === 'http://127.0.0.1:' + controlPort)) {
      const action = url.searchParams.get('action');
      if (action === 'reset') {
        timers.forEach(clearTimeout); timers = [];
        await fixture.reset(); fixture.advance(Date.now() - baseline); requests.length = 0;
      }
      if (action === 'expire-proof') fixture.advance(16 * 60 * 1000);
      if (action === 'expire-session') fixture.advance(8 * 24 * 60 * 60 * 1000);
      if (action === 'revoke') fixture.prisma.tables.identitySession.forEach(session => { session.revokedAt = new Date(); });
      if (action === 'missing-webhook') webhookMode = 'missing';
      if (action === 'delayed-webhook') webhookMode = 'delayed';
      if (action === 'fail-mail') fixture.failMail();
      res.writeHead(303, { Location: '/' }).end(); return;
    }
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.end(`<!doctype html><title>Synthetic identity harness</title><h1>Synthetic identity harness</h1>
      <p>Local test only. In-memory database, fake mail and Stripe; no external services.</p>
      <a href="${clientOrigin}">Open React app</a> · <a href="/open-latest">Open latest synthetic email link</a> · <a href="${clientOrigin}/__identity-checks">Run browser contract checks</a>
      ${['reset','expire-proof','expire-session','revoke','missing-webhook','delayed-webhook','fail-mail'].map(action => `<form method="post" action="/control?action=${action}"><button>${action}</button></form>`).join('')}
      ${url.pathname === '/portal' ? `<h2>Fake hosted portal</h2><a href="${clientOrigin}/manage-account">Return to account</a>` : ''}
      ${url.pathname === '/checkout' ? `<h2>Fake hosted Checkout</h2><a href="${clientOrigin}/complete-registration?success=true&session_id=${encodeURIComponent(url.searchParams.get('session') ?? '')}">Return from Checkout</a>` : ''}`);
  });
  await new Promise((resolve, reject) => { controls.once('error', reject); controls.listen(controlPort, '127.0.0.1', resolve); });
  return { fixture, close: async () => { timers.forEach(clearTimeout); await new Promise(resolve => controls.close(resolve)); await fixture.close(); } };
};
