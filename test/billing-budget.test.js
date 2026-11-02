const assert = require('node:assert/strict');
const { test } = require('node:test');
const createRequestBudget = require('../billing/budget');

test('provider work is bounded even when requests fail and callers retry', async () => {
  const request = createRequestBudget({ requests: 2 });
  let calls = 0;
  const providerFailure = async () => {
    calls++;
    throw new Error('synthetic provider unavailable');
  };
  await assert.rejects(request(providerFailure));
  await assert.rejects(request(providerFailure));
  await assert.rejects(request(providerFailure), (error) => error.code === 'PROVIDER_BUDGET');
  assert.equal(calls, 2, 'exhaustion must prevent another provider call');
});

test('elapsed provider budget prevents further calls without relying on a proxy', async () => {
  let time = 0;
  let calls = 0;
  const request = createRequestBudget({ milliseconds: 10, clock: () => time });
  await request(async () => {
    calls++;
  });
  time = 10;
  await assert.rejects(
    request(async () => {
      calls++;
    }),
    (error) => error.code === 'PROVIDER_BUDGET'
  );
  assert.equal(calls, 1);
});
