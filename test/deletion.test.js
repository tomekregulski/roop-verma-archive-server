const { test, before, beforeEach, after } = require('node:test');
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
require('./support/deletion-cases').deletionCases({
  test: (name, fn) => test(name, { timeout: 10000 }, fn),
  fixture: () => f,
});
