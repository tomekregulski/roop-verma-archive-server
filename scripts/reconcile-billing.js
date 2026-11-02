// No dotenv, app startup, scheduler or public repair endpoint. Inspect is default.
const path = require('node:path');
const { PrismaClient } = require('@prisma/client');
const { API_VERSION } = require('../billing/evidence');
const { createBilling } = require('../billing/service');
const { reconcileBatch, reconcileCustomer } = require('../billing/reconcile');
async function main() {
  const args = process.argv.slice(2);
  const value = (flag) => {
    const i = args.indexOf(flag);
    return i < 0 ? undefined : args[i + 1];
  };
  const fixture = value('--fixture');
  if (!fixture && value('--provider') !== 'stripe')
    throw new Error('Choose an offline --fixture module or explicitly --provider stripe');
  const stripe = fixture
    ? require(path.resolve(fixture))
    : require('stripe')(process.env.STRIPE_SECRET_KEY, {
        apiVersion: API_VERSION,
        timeout: 10000,
        maxNetworkRetries: 0,
      });
  if (!process.env.BILLING_DATABASE_URL) throw new Error('Explicit BILLING_DATABASE_URL required');
  const db = new PrismaClient({ datasources: { db: { url: process.env.BILLING_DATABASE_URL } } });
  try {
    let operations;
    const billing = createBilling({
      db,
      stripe,
      config: require('../billing/config'),
      recoverCustomer: (id) => operations.recoverCustomer(id),
    });
    operations = require('../billing/operations').createOperations({
      db,
      stripe,
      billing,
      clientOrigin: process.env.CLIENT_URL,
    });
    const options = {
      db,
      stripe,
      billing,
      operations,
      apply: args.includes('--apply'),
      limit: Number(value('--limit') || 10),
    };
    const report = value('--customer')
      ? await reconcileCustomer({
          ...options,
          customerId: value('--customer'),
          restart: args.includes('--restart'),
        })
      : await reconcileBatch({
          ...options,
          after: value('--after'),
          invoiceLimit: Number(value('--invoice-limit') || 10),
        });
    // Cursor is an opaque Stripe ID, never an email/payload/provider error body.
    console.log(JSON.stringify(report));
    if (report.failures || report.operations?.unresolved) process.exitCode = 1;
  } finally {
    await db.$disconnect();
  }
}
main().catch(() => {
  console.error('Billing reconciliation failed; no cursor advanced past the failed batch');
  process.exitCode = 1;
});
