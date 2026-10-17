const Module = require('node:module');
const express = require('express');

// Used only in isolated test processes. Never load .env or real service clients.
module.exports = async function createIdentityFixture() {
  const calls = [];
  const user = { id: 1, email: 'a@example.invalid', stripeId: 'cus_test_a' };
  const record = (name, result) => async () => {
    calls.push(name);
    return result;
  };
  const prisma = {
    user: {
      findUnique: record('user.findUnique', user),
      findMany: record('user.findMany', [user]),
      delete: record('user.delete', user),
      deleteMany: record('user.deleteMany', { count: 1 }),
    },
    subscription: {
      findMany: record('subscription.findMany', []),
      deleteMany: record('subscription.deleteMany', { count: 1 }),
    },
  };
  const stripe = {
    customers: { create: record('stripe.customers.create', { id: 'cus_test_new' }) },
    billingPortal: { sessions: { create: record('stripe.portal.create', {}) } },
  };
  const previousKey = process.env.API_KEY;
  const previousSecret = process.env.JWT_SECRET;
  process.env.API_KEY = 'synthetic-public-key';
  process.env.JWT_SECRET = 'synthetic-test-secret';
  const originalLoad = Module._load;
  let authRouter;
  let userRouter;
  try {
    Module._load = function (request, ...args) {
      if (request === '@prisma/client') {
        return { PrismaClient: class { constructor() { return prisma; } } };
      }
      if (request === 'stripe') return () => stripe;
      if (request === 'dotenv') return { config() {} };
      return originalLoad.call(this, request, ...args);
    };
    authRouter = require('../../routes/v1/auth');
    userRouter = require('../../routes/v1/user');
  } finally {
    Module._load = originalLoad;
  }

  const app = express();
  app.use(express.json());
  app.use('/api/v1/auth', authRouter);
  app.use('/api/v1/user', userRouter);
  app.use(require('../../handlers/error'));
  const restoreEnvironment = () => {
    if (previousKey === undefined) delete process.env.API_KEY;
    else process.env.API_KEY = previousKey;
    if (previousSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = previousSecret;
  };
  let server;
  try {
    server = await new Promise((resolve, reject) => {
      const listening = app.listen(0, '127.0.0.1', () => resolve(listening));
      listening.on('error', reject);
    });
  } catch (error) {
    restoreEnvironment();
    throw error;
  }
  const origin = `http://127.0.0.1:${server.address().port}`;
  return {
    user, prisma, calls,
    async request(path, options) {
      calls.length = 0;
      const response = await fetch(`${origin}/api/v1/${path}`, {
        ...options,
        signal: AbortSignal.timeout(5000),
      });
      return { status: response.status, body: await response.json() };
    },
    async close() {
      try {
        await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
      } finally {
        restoreEnvironment();
      }
    },
  };
};
