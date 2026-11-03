const { test, before, beforeEach, after } = require('node:test');
let f;
before(async () => {
  f = await require('./support/paid-access-http')();
});
beforeEach(async () => {
  await f.reset();
});
after(async () => {
  if (f) await f.close();
});
require('./support/paid-access-cases').paidAccessCases({ test, fixture: () => f });
