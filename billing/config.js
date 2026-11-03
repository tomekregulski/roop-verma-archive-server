const { problem } = require('./evidence');
module.exports = function billingConfig(env = process.env) {
  if (
    !/^price_[A-Za-z0-9_]+$/.test(env.BILLING_PRICE_ID || '') ||
    !/^prod_[A-Za-z0-9_]+$/.test(env.BILLING_PRODUCT_ID || '') ||
    !/^[a-z]{3}$/.test(env.BILLING_CURRENCY || '') ||
    !['true', 'false'].includes(env.BILLING_LIVEMODE)
  )
    throw problem('BILLING_CONFIGURATION');
  return {
    priceId: env.BILLING_PRICE_ID,
    productId: env.BILLING_PRODUCT_ID,
    currency: env.BILLING_CURRENCY,
    livemode: env.BILLING_LIVEMODE === 'true',
  };
};
