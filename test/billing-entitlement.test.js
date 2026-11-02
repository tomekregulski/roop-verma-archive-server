const { test, before, beforeEach, after } = require('node:test');
let f;
before(async () => {
  f = await require('./support/billing-http')();
});
beforeEach(async () => f.reset());
after(async () => {
  if (f) await f.close();
});
require('./support/billing-cases')({ test, fixture: () => f });
