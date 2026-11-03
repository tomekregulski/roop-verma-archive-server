const { test, before, beforeEach, after } = require('node:test');
const { purchaseCases } = require('./support/purchase-cases');
let f;
before(async () => {
  f = await require('./support/purchase-http')();
});
beforeEach(async () => {
  await f.reset();
});
after(async () => {
  if (f) await f.close();
});
purchaseCases({ test, fixture: () => f });
