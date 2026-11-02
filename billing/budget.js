const { problem } = require('./evidence');

// Each caller explicitly supplies one Stripe request. SDK timeouts bound a
// request already in flight; this limit stops the rest of a long scan or retry.
module.exports = function createRequestBudget({
  requests = 120,
  milliseconds = 20000,
  clock = Date.now,
} = {}) {
  const deadline = clock() + milliseconds;
  return async function request(callStripe) {
    if (requests <= 0 || clock() >= deadline) throw problem('PROVIDER_BUDGET');
    requests--;
    return callStripe();
  };
};
