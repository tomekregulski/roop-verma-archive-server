// One billing composition for normal routes and dependency-injected verification.
function createBillingRuntime({ db, stripe, config, identityConfig, now }) {
  const access = require('./paid-access').createPaidAccess({ db, stripe, config, now,
  });
  const purchase = require('./purchase').createPurchase({
    db,
    stripe,
    config,
    clientOrigin: identityConfig.clientOrigin,
    now,
    access,
  });
  const deletion = require('./deletion').createDeletion({
    db,
    purchase,
    now,
  });
  return { stripe, access, purchase, deletion, readEntitlement: access.readEntitlement,
  };
}
module.exports = { createBillingRuntime };
