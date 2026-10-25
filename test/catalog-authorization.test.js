const assert = require('node:assert/strict');
const { test, before, after, beforeEach, mock } = require('node:test');
const createFixture = require('./support/identity-http');
const addCatalogDatabase = require('./support/catalog-db');
let f;
before(async () => {
  mock.method(console, 'log', () => {});
  f = await createFixture();
  addCatalogDatabase(f.prisma, f.calls);
});
beforeEach(async () => {
  await f.reset();
  for (const model of ['artist', 'category', 'event', 'location', 'mediaType', 'raga', 'tape', 'track', 'tribute']) {
    f.prisma.tables[model].push({ id: 1, name: 'Existing ' + model, trackId: 1, tapeId: 1,
      alternateSpelling: '', content: 'Original tribute', public: true });
  }
});
after(async () => { if (f) await f.close(); });

const catalogResources = ['artist', 'category', 'event', 'location', 'media-type', 'raga', 'tape', 'track'];
const mutations = catalogResources.flatMap(resource => ['POST', 'PUT', 'DELETE'].map(method => ({ resource, method })));
mutations.push(...['POST', 'PUT', 'DELETE'].map(method => ({ resource: 'tribute', method })));
const inputs = {
  artist: { name: 'New artist' }, category: { name: 'New category' }, location: { name: 'New location' },
  'media-type': { name: 'New media type' },
  event: { eventName: 'Synthetic event', date: '2026-10-25', locationId: 1, categoryId: 1, notes: 'Synthetic notes' },
  raga: { name: 'New raga', alternateSpelling: '', time: 'Morning', rasa: 'Peace' },
  tape: { tapeId: 2, eventId: 1 },
  track: { trackId: 2, tapeId: 1, ragaId: 1, primaryArtistId: 1, mediaTypeId: 1,
    alap: true, jor: false, jhalla: false, slowGat: false, mediumGat: false, fastGat: false,
    accompanied: false, master: false, public: false, url: 'https://media.example.invalid/synthetic' },
  tribute: { type: 'text', submittedBy: 'Synthetic contributor', content: 'Updated tribute' },
};
function mutate(route, cookie, options = {}) {
  return f.request(`${route.resource}/${options.key || 'synthetic-public-key'}${options.query || ''}`, {
    method: route.method,
    headers: { 'Content-Type': 'application/json', 'X-RVDL-CSRF': '1',
      ...(cookie ? { Cookie: cookie } : {}), ...options.headers },
    body: JSON.stringify(options.body || { ...(route.method === 'POST' ? {} : { id: 1 }), ...inputs[route.resource] }),
  });
}
async function denied(route, cookie, status, options) {
  const before = structuredClone(f.prisma.tables);
  f.calls.length = 0;
  const response = await mutate(route, cookie, options);
  assert.equal(response.status, status);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.deepEqual(f.prisma.tables, before, 'denial must leave all stored data unchanged');
  assert.equal(f.calls.every(call => call === 'identitySession.findUnique'), true,
    'only authentication reads may run; no catalog/controller or downstream calls');
}

// Compare the actual mounted Express routes to the reviewed inventory. Adding
// an alternate/bulk path (or method) must require a new HTTP policy test here.
test('mounted catalog and tribute route inventory has no unreviewed mutation paths', () => {
  function mounted(parent, path) {
    const layers = parent.stack.filter(layer => layer.name === 'router' && layer.regexp.test(path));
    assert.equal(layers.length, 1, 'expected one mounted router for ' + path);
    return layers[0].handle;
  }
  const v1 = mounted(f.app._router, '/api/v1');
  const reviewedMounts = [...catalogResources, 'tribute', 'user', 'auth', 'payment', 'network-error'];
  assert.equal(v1.stack.length, reviewedMounts.length, 'review any new top-level router or catalog alias');
  for (const path of reviewedMounts) mounted(v1, '/' + path);
  for (const resource of [...catalogResources, 'tribute']) {
    const router = mounted(v1, '/' + resource);
    assert.equal(router.stack.every(layer => Boolean(layer.route)), true, 'review new router middleware/aliases');
    const actual = router.stack.flatMap(layer => Object.keys(layer.route.methods)
      .map(method => `${method.toUpperCase()} ${layer.route.path}`)).sort();
    const expected = ['GET /:key', 'POST /:key', 'PUT /:key', 'DELETE /:key'];
    if (resource === 'track') expected.push('GET /public/:key', 'POST /track-play/:key');
    assert.deepEqual(actual, expected.sort(), resource + ' routes must match HTTP coverage');
  }
});

for (const route of mutations) {
  test(`${route.method} /${route.resource}/:key rejects unverified identity before effects`, async () => {
    await denied(route, null, 401); // Public API key alone is insufficient.
    await denied(route, f.config.cookieName + '=malformed', 401);
    await denied(route, f.config.cookieName + '=' + 'x'.repeat(43), 401);
    await denied(route, null, 401, { headers: {
      jwt: JSON.stringify({ isAdmin: true, userId: 3 }), Authorization: 'Bearer synthetic-admin-token',
    } });

    const cookie = await f.login('admin@example.invalid');
    f.advance(7 * 86400000); // Exact expiry, not just a time beyond it.
    await denied(route, cookie, 401);
    f.advance(-7 * 86400000);
    assert.equal((await f.json('auth/logout', {}, cookie)).status, 204);
    await denied(route, cookie, 401);
  });

  test(`${route.method} /${route.resource}/:key requires current admin role and CSRF`, async () => {
    const userCookie = await f.login();
    await denied(route, userCookie, 403);
    await denied(route, userCookie, 403, { query: '?isAdmin=true&role=admin&userId=3',
      body: { id: 1, ...inputs[route.resource], isAdmin: true, admin: true, role: 'admin', userId: 3, identity: { user: { isAdmin: true } } },
      headers: { 'X-Admin': 'true', 'X-User-Id': '3', jwt: JSON.stringify({ isAdmin: true }) } });
    const cookie = await f.login('admin@example.invalid');
    await denied(route, cookie, 403, { headers: { 'X-RVDL-CSRF': '' } });
    await denied(route, cookie, 403, { headers: { Origin: 'https://evil.example.invalid' } });
    await denied(route, cookie, 403, { headers: { Origin: 'null' } });
    await denied(route, cookie, 403, { key: 'wrong-key' });
    // The same still-valid session must lose authority on the next request.
    f.prisma.tables.user.find(user => user.id === 3).isAdmin = false;
    await denied(route, cookie, 403);
  });
}

test('one existing admin session can create, update and delete catalog data, then loses authority when demoted', async () => {
  const cookie = await f.login('admin@example.invalid');
  const route = { resource: 'artist', method: 'POST' };
  const created = await mutate(route, cookie, { body: { name: 'New synthetic artist' }, headers: { Origin: f.config.clientOrigin } });
  assert.equal(created.status, 200);
  assert.deepEqual(created.body.data, { id: 2, name: 'New synthetic artist' });
  assert.deepEqual(f.prisma.tables.artist.at(-1), created.body.data);
  const updated = await mutate({ ...route, method: 'PUT' }, cookie, { body: { id: 2, name: 'Renamed artist' } });
  assert.equal(updated.status, 200);
  assert.equal(f.prisma.tables.artist.at(-1).name, 'Renamed artist');
  const removed = await mutate({ ...route, method: 'DELETE' }, cookie, { body: { id: 2 } });
  assert.equal(removed.status, 200);
  assert.equal(f.prisma.tables.artist.length, 1);
  f.prisma.tables.user.find(user => user.id === 3).isAdmin = false;
  for (const method of ['POST', 'PUT', 'DELETE']) await denied({ ...route, method }, cookie, 403);
});

for (const resource of catalogResources.filter(resource => resource !== 'media-type')) {
  test(`admin can create, update and delete ${resource} through real controllers`, async () => {
    const cookie = await f.login('admin@example.invalid');
    const model = resource;
    const created = await mutate({ resource, method: 'POST' }, cookie);
    assert.equal(created.status, 200);
    assert.equal(f.prisma.tables[model].length, 2);
    const id = created.body.data.id;
    const changedField = { event: { eventName: 'Renamed event' }, tape: { tapeId: 3 }, track: { trackId: 3 } }[resource] || { name: 'Renamed' };
    const updated = await mutate({ resource, method: 'PUT' }, cookie, { body: { ...inputs[resource], id, ...changedField } });
    assert.equal(updated.status, 200);
    assert.deepEqual(f.prisma.tables[model].find(row => row.id === id), updated.body.data);
    assert.equal((await mutate({ resource, method: 'DELETE' }, cookie, { body: { id } })).status, 200);
    assert.equal(f.prisma.tables[model].length, 1);
  });
}

test('admin media-type creation/deletion still works (pre-existing update target bug recorded separately)', async () => {
  const cookie = await f.login('admin@example.invalid');
  const created = await mutate({ resource: 'media-type', method: 'POST' }, cookie, { body: { name: 'Synthetic media' } });
  assert.equal(created.status, 200);
  assert.equal(f.prisma.tables.mediaType.length, 2);
  assert.equal((await mutate({ resource: 'media-type', method: 'DELETE' }, cookie, { body: { id: created.body.data.id } })).status, 200);
  assert.equal(f.prisma.tables.mediaType.length, 1);
});

test('admin can create and moderate tributes', async () => {
  const cookie = await f.login('admin@example.invalid');
  const created = await mutate({ resource: 'tribute', method: 'POST' }, cookie);
  assert.equal(created.status, 200);
  assert.equal(f.prisma.tables.tribute.length, 2);
  assert.equal(f.prisma.tables.tribute.at(-1).content, inputs.tribute.content);
  assert.equal((await mutate({ resource: 'tribute', method: 'PUT' }, cookie)).status, 200);
  assert.equal(f.prisma.tables.tribute[0].content, inputs.tribute.content);
  assert.equal((await mutate({ resource: 'tribute', method: 'DELETE' }, cookie)).status, 200);
  assert.equal(f.prisma.tables.tribute.length, 1);
  assert.equal((await mutate({ resource: 'tribute', method: 'DELETE' }, cookie, { body: { id: created.body.data.id } })).status, 200);
  assert.equal(f.prisma.tables.tribute.length, 0);
});

test('deleted accounts and email changes invalidate admin sessions on every mutation route', async () => {
  const cookie = await f.login('admin@example.invalid');
  const admin = f.prisma.tables.user.find(user => user.id === 3);
  admin.email = 'changed@example.invalid';
  for (const route of mutations) await denied(route, cookie, 401);
  admin.email = 'admin@example.invalid';
  await f.prisma.user.delete({ where: { id: 3 } });
  for (const route of mutations) await denied(route, cookie, 401);
});

test('session storage failure fails closed before every catalog/moderation controller', async () => {
  const cookie = await f.login('admin@example.invalid');
  const original = f.prisma.identitySession.findUnique;
  f.prisma.identitySession.findUnique = async () => { throw new Error('synthetic database failure'); };
  try {
    for (const route of mutations) await denied(route, cookie, 500);
  } finally { f.prisma.identitySession.findUnique = original; }
});

for (const resource of ['track', 'raga']) {
  test(`denied ${resource} nested/bulk Prisma input cannot reach a mutation delegate`, async () => {
    const cookie = await f.login();
    const body = { id: 1, ...inputs[resource], tracks: { createMany: { data: [{ trackId: 99 }] }, deleteMany: {} },
      tape: { update: { event: { update: { eventName: 'Unauthorized nested edit' } } } } };
    for (const method of ['POST', 'PUT', 'DELETE']) await denied({ resource, method }, cookie, 403, { body });
  });
}

test('catalog and tribute GETs and playback telemetry retain their existing access', async () => {
  for (const resource of [...catalogResources, 'tribute']) {
    assert.equal((await f.request(resource + '/synthetic-public-key')).status, 200);
  }
  assert.equal((await f.request('track/public/synthetic-public-key')).status, 200);
  assert.equal((await f.json('track/track-play/synthetic-public-key', { userId: 1, trackId: 1, secondsListened: 10 })).status, 200);
  assert.equal(f.prisma.tables.trackPlay.length, 1);
});
