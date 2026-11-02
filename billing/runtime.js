const { db, config: identityConfig } = require('../identity/runtime');
const billingConfig = require('./config');
const { API_VERSION } = require('./evidence');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY, {
  apiVersion: API_VERSION,
  timeout: 10000,
  maxNetworkRetries: 0,
});
const { createBilling } = require('./service');
const { createOperations } = require('./operations');
let operations;
const billing = createBilling({
  db,
  stripe,
  config: billingConfig,
  recoverCustomer: (id) => operations.recoverCustomer(id),
});
operations = createOperations({ db, stripe, billing, clientOrigin: identityConfig.clientOrigin });
module.exports = {
  stripe,
  billing,
  operations,
  readEntitlement: require('./reader').createEntitlementReader({ db, config: billingConfig }),
};
