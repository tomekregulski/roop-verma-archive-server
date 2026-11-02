const Module = require('node:module');
const { createIdentity } = require('../../identity/service');
const configuration = require('../../identity/config');
const createMailer = require('../../identity/mail');
const memoryDatabase = require('./memory-db');

// One fixture per isolated test process: imported controllers retain these doubles.
module.exports = async function createIdentityFixture(options = {}) {
  const calls = [];
  const mail = [];
  const warnings = [];
  const db = options.db || memoryDatabase(calls);
  let time = new Date('2026-10-17T16:00:00Z');
  let mailFailure = false;
  const config = configuration({
    CLIENT_URL: 'https://client.example.invalid',
    AUTH_RATE_LIMIT_SECRET: 'synthetic-rate-secret-at-least-32-characters',
    RESEND_API_KEY: 'synthetic-mail-key',
    LOGIN_EMAIL_FROM: 'login@example.invalid',
    ...options.configuration,
  });
  const sendEmail = createMailer(config, async (_url, request) => {
    calls.push('mail.send');
    const payload = JSON.parse(request.body);
    mail.push({ to: payload.to[0], link: payload.text.split('\n')[1] });
    if (mailFailure) throw new Error('synthetic provider failure with sensitive payload');
    return { ok: true, json: async () => ({ id: 'synthetic-mail-id' }) };
  });
  const identity = createIdentity({
    db,
    config,
    sendEmail,
    now: () => time,
    wait: async () => {},
    responseFloorMs: 0,
  });
  const stripe = options.stripe || require('./billing-provider').provider(calls);
  // Test-only composition. Normal application runtime has no alternate-adapter flag.
  const billingAdapter = options.billingAdapter?.({
    db,
    stripe,
    now: () => time,
  });
  const purchase = options.purchaseAdapter?.({
    db,
    stripe,
    config: options.billingConfiguration || require('./billing-provider').config,
    clientOrigin: config.clientOrigin,
    now: () => time,
    access: billingAdapter,
  });
  const notifications = [];
  const deletion =
    purchase &&
    require('../../billing/deletion').createDeletion({
      db,
      purchase,
      clientOrigin: config.clientOrigin,
      now: () => time,
      sendNotification: options.noDeletionMail
        ? null
        : require('../../identity/mail').createDeletionMailer(
            { ...config, deletionSupportEmail: 'support@example.invalid' },
            async (_url, request) => {
              calls.push('deletion.mail.send');
              notifications.push(JSON.parse(request.body));
              if (mailFailure) throw Error('synthetic notification failure');
              return {
                ok: true,
                json: async () => ({ id: 'synthetic-notification-id' }),
              };
            }
          ),
    });
  let operations;
  const billing = require('../../billing/service').createBilling({
    db,
    stripe,
    config: options.billingConfiguration || require('./billing-provider').config,
    now: () => time,
    recoverCustomer: (id) => operations.recoverCustomer(id),
  });
  operations = require('../../billing/operations').createOperations({
    db,
    stripe,
    billing,
    clientOrigin: config.clientOrigin,
    now: () => time,
  });
  const readEntitlement = require('../../billing/reader').createEntitlementReader({
    db,
    config: options.billingConfiguration || require('./billing-provider').config,
    now: () => time,
  });
  const priorEnv = {
    API_KEY: process.env.API_KEY,
    CLIENT_URL: process.env.CLIENT_URL,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
  };
  process.env.API_KEY = 'synthetic-public-key';
  process.env.CLIENT_URL = config.clientOrigin;
  process.env.STRIPE_WEBHOOK_SECRET = 'whsec_synthetic_fixture_only';
  const originalLoad = Module._load;
  let app;
  try {
    Module._load = function (request, ...args) {
      if (
        purchase &&
        ['/routes/v1/payments/index.js', '/routes/v1/user/index.js'].some((path) =>
          Module._resolveFilename(request, args[0]).endsWith(path)
        )
      )
        return originalLoad.call(this, request, ...args).createPurchaseRouter(purchase, deletion);
      if (request === '@prisma/client')
        return {
          PrismaClient: class {
            constructor() {
              return db;
            }
          },
        };
      if (request === 'stripe') return () => stripe;
      if (request === 'dotenv') return { config() {} };
      if (
        Module._resolveFilename(request, args[0]).endsWith('/playback/runtime.js') &&
        options.playbackAdapters
      ) {
        return require('../../playback/service').createPlayback({
          db,
          identity,
          now: () => time,
          ...options.playbackAdapters({ db, calls, now: () => time }),
        });
      }
      if (Module._resolveFilename(request, args[0]).endsWith('/billing/runtime.js'))
        return {
          stripe,
          billing: billingAdapter
            ? { ...billing, processEvent: billingAdapter.processEvent }
            : billing,
          operations,
          readEntitlement,
        };
      if (Module._resolveFilename(request, args[0]).endsWith('/identity/runtime.js'))
        return { db, config, identity };
      return originalLoad.call(this, request, ...args);
    };
    app = require('../../app')();
  } finally {
    Module._load = originalLoad;
  }
  const restoreEnvironment = () => {
    for (const [key, value] of Object.entries(priorEnv)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  };
  let server;
  try {
    server = await new Promise((resolve, reject) => {
      const listening = app.listen(options.port || 0, '127.0.0.1', () => resolve(listening));
      listening.on('error', reject);
    });
  } catch (error) {
    restoreEnvironment();
    throw error;
  }
  const origin = 'http://127.0.0.1:' + server.address().port;
  const fixture = {
    app,
    server,
    origin,
    user: null,
    prisma: db,
    calls,
    mail,
    warnings,
    config,
    stripe,
    identity,
    billing,
    billingAdapter,
    purchase,
    deletion,
    notifications,
    operations,
    readEntitlement,
    advance(ms) {
      time = new Date(time.getTime() + ms);
    },
    failMail(value = true) {
      mailFailure = value;
    },
    async reset() {
      calls.length = 0;
      mail.length = 0;
      notifications.length = 0;
      warnings.length = 0;
      mailFailure = false;
      time = new Date('2026-10-17T16:00:00Z');
      stripe.reset?.();
      if (db.tables) {
        for (const key of Object.keys(db.tables)) db.tables[key].length = 0;
        db.tables.user.push(
          {
            id: 1,
            email: 'a@example.invalid',
            stripeId: 'cus_test_a',
            firstName: 'A',
            lastName: 'Test',
            isAdmin: false,
            subscriptionActive: 'active',
          },
          {
            id: 2,
            email: 'b@example.invalid',
            stripeId: 'cus_test_b',
            firstName: 'B',
            lastName: 'Test',
            isAdmin: false,
            subscriptionActive: 'active',
          },
          {
            id: 3,
            email: 'admin@example.invalid',
            stripeId: 'cus_test_admin',
            firstName: 'Admin',
            lastName: 'Test',
            isAdmin: true,
            subscriptionActive: null,
          }
        );
        db.tables.subscription.push(
          { id: 'sub_test_a', userId: 1, stripeId: 'cus_test_a' },
          { id: 'sub_test_b', userId: 2, stripeId: 'cus_test_b' }
        );
        for (const user of db.tables.user)
          db.tables.billingCustomer.push({
            customerId: user.stripeId,
            userId: user.id,
            livemode: false,
            revision: 0,
            deletedAt: null,
            deletionRequestedAt: null,
            stripeDeletedAt: null,
            syncIssueCode: null,
            reconcileCursor: null,
          });
        fixture.user = db.tables.user[0];
      }
    },
    async request(path, options = {}) {
      const response = await fetch(origin + '/api/v1/' + path, {
        ...options,
        signal: AbortSignal.timeout(10000),
      });
      const text = await response.text();
      return {
        status: response.status,
        body: text ? JSON.parse(text) : null,
        headers: response.headers,
        cookie: response.headers.get('set-cookie')?.split(';')[0],
      };
    },
    async json(path, body, cookie, extraHeaders = {}) {
      return fixture.request(path, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-RVDL-CSRF': '1',
          ...(cookie ? { Cookie: cookie } : {}),
          ...extraHeaders,
        },
        body: JSON.stringify(body),
      });
    },
    async login(email = 'a@example.invalid') {
      const requested = await fixture.json('auth/login', { email });
      if (requested.status !== 202) throw new Error('Synthetic login initiation failed');
      const token = new URL(mail[mail.length - 1].link).hash.slice('#token='.length);
      const result = await fixture.json('auth/verify', { token });
      if (result.status !== 200) throw new Error('Synthetic login verification failed');
      return result.cookie;
    },
    async close() {
      try {
        await new Promise((resolve, reject) =>
          server.close((error) => (error ? reject(error) : resolve()))
        );
      } finally {
        restoreEnvironment();
      }
    },
  };
  await fixture.reset();
  return fixture;
};
