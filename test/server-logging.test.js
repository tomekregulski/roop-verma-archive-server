const assert = require('node:assert/strict');
const { test, before, after } = require('node:test');
let f;
before(async () => {
  f = await require('./support/purchase-http')();
});
after(async () => {
  if (f) await f.close();
});
test('unexpected HTTP failures carry a request reference and safe operation context only', async () => {
  const logs = [],
    original = console.error,
    find = f.prisma.track.findUnique;
  console.error = (line) => logs.push(line);
  f.prisma.track.findUnique = async () => {
    throw Object.assign(
      Error('secret_cookie proof private-url customer email'),
      {
        config: { headers: { Authorization: 'secret_header' } },
      }
    );
  };
  try {
    const result = await f.json(
      'track/10/playback-access/synthetic-public-key',
      {}
    );
    assert.equal(result.status, 500);
    const reference = result.headers.get('x-request-id');
    assert.match(reference, /^[a-f0-9-]{36}$/);
    assert.ok(logs.some((line) => JSON.parse(line).requestId === reference));
    assert.ok(
      logs.some(
        (line) =>
          JSON.parse(line).operation ===
          'POST /api/v1/track/:trackId/playback-access/:key'
      )
    );
    for (const text of [
      'secret_cookie',
      'secret_header',
      'private-url',
      'customer email',
      'synthetic-public-key',
    ])
      assert.equal(logs.join('').includes(text), false);
  } finally {
    console.error = original;
    f.prisma.track.findUnique = find;
  }
});
