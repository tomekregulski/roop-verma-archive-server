const { db, config: identityConfig } = require('../identity/runtime');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY, {
  apiVersion: require('./evidence').API_VERSION,
  timeout: 10000,
  maxNetworkRetries: 0,
});
module.exports = require('./compose').createBillingRuntime({
  db,
  stripe,
  config: require('./config'),
  identityConfig,
});
