// Explicit local test fixture; never imported by application startup.
const createFixture = require('./identity-http');
const addCatalog = require('./catalog-db');
const { config } = require('./billing-provider');
const { postEvent, cancellation } = require('./paid-access-cases');

/** Exercises existing HTTP authorization against a supplied real delivery adapter. */
module.exports = async function providerPlayback({ delivery, port = 3181, catalogTrack } = {}) {
  if (process.env.NODE_ENV === 'production' || !delivery)
    throw Error('Explicit non-production delivery adapter required');
  const clientOrigin = 'http://127.0.0.1:3180';
  if (catalogTrack && (!Number.isInteger(catalogTrack.id) || catalogTrack.id < 1 ||
      catalogTrack.public !== false || Object.hasOwn(catalogTrack, 'url')))
    throw Error('Explicit subscriber catalog snapshot without media locator required');
  let fixture, failNextDelivery = false;
  fixture = await createFixture({
    port,
    configuration: { CLIENT_URL: clientOrigin, SESSION_COOKIE_SECURE: 'false' },
    playbackAdapters: () => ({
      ...delivery,
      /** Simulates one storage outage before real delivery, without bypassing authorization. */
      async resolveAsset(trackId) {
        if (failNextDelivery) {
          failNextDelivery = false;
          throw Error('Synthetic one-shot delivery failure');
        }
        const asset = await delivery.resolveAsset(trackId);
        fixture.advance(Date.now() - fixture.clock().getTime());
        return asset;
      },
    }),
  });
  fixture.advance(Date.now() - fixture.clock().getTime());
  fixture.server.prependListener('request', () => {
    fixture.advance(Date.now() - fixture.clock().getTime());
  });
  addCatalog(fixture.prisma, fixture.calls);
  const track = catalogTrack ? structuredClone(catalogTrack) : {
    id: 10, trackId: 10, tapeId: 1, ragaId: 1, primaryArtistId: 1,
    plays: 0, alap: true, jor: false, jhalla: false, slowGat: false,
    mediumGat: false, fastGat: false, accompanied: false, notes: '',
    audioQuality: 'Generated test tone', mediaTypeId: 1, public: false,
    url: '', master: false,
    raga: { id: 1, name: 'Synthetic private sample', alternateSpelling: '', time: '', rasa: '', tracks: [] },
    tape: { id: 1, eventId: 1, tapeId: 1, event: {
      id: 1, eventName: 'Synthetic fixture', date: '15-minute generated MP3', notes: '',
      locationId: 1, location: { id: 1, name: 'Local test' },
      categoryId: 1, category: { id: 1, name: 'Synthetic' }, tapes: [],
    } },
  };
  fixture.prisma.tables.track.push(track);
  fixture.stripe.resources.subscriptions.push({
    id: 'sub_test_a', object: 'subscription', customer: 'cus_test_a',
    livemode: false, status: 'active', items: { has_more: false, data: [{
      quantity: 1, price: { id: config.priceId, product: config.productId,
        currency: config.currency, recurring: { interval: 'month', interval_count: 1 } },
    }] },
  });
  await fixture.prisma.billingCustomer.update({ where: { userId: 1 }, data: {
    selectedSubscriptionId: 'sub_test_a', selectedCanceledAt: null,
    cachedStatus: null, accessPolicyKey: null, accessCheckedAt: null, accessFreshUntil: null,
  } });
  const requests = [];
  fixture.server.prependListener('request', (req, res) => {
    if (!req.url.includes('/playback-access/')) return;
    res.once('finish', () => requests.push(res.statusCode));
  });
  /** Sends the existing signed synthetic cancellation through actual webhook verification. */
  async function cancel() {
    const sub = fixture.stripe.resources.subscriptions[0];
    sub.status = 'canceled';
    const result = await postEvent(fixture, cancellation(sub, 'evt_provider_sample_cancel'));
    if (result.status !== 200) throw Error('Synthetic cancellation failed');
  }

  return {
    fixture,
    cancel,
    /** Handles only fixed local controls; never exposes proofs, cookies or signed URLs. */
    async control(req, res) {
      res.setHeader('Cache-Control', 'no-store');
      if (req.headers['x-rvdl-test'] !== '1' ||
          (req.headers.origin && req.headers.origin !== clientOrigin)) {
        res.writeHead(403).end(); return;
      }
      const url = new URL(req.url, clientOrigin);
      const action = url.searchParams.get('action');
      if (req.method === 'GET' && action === 'state') {
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ trackId: track.id, public: track.public, plays: track.plays, requests })); return;
      }
      if (req.method !== 'POST') { res.writeHead(405).end(); return; }
      if (action === 'login') {
        const actors = { listener: 'a@example.invalid', other: 'b@example.invalid', unsubscribed: 'admin@example.invalid' };
        const email = actors[url.searchParams.get('actor')];
        if (!email) { res.writeHead(400).end(); return; }
        const cookie = await fixture.login(email);
        res.setHeader('Set-Cookie', `${cookie}; Path=/; HttpOnly; SameSite=Lax`);
      } else if (action === 'fail-next') {
        failNextDelivery = true;
      } else if (action === 'public') {
        const value = url.searchParams.get('value');
        if (!['true', 'false'].includes(value)) { res.writeHead(400).end(); return; }
        track.public = value === 'true';
      } else if (action === 'past-due') {
        fixture.stripe.resources.subscriptions[0].status = 'past_due';
        await fixture.prisma.billingCustomer.update({ where: { userId: 1 }, data: {
          cachedStatus: null, accessPolicyKey: null, accessCheckedAt: null, accessFreshUntil: null,
        } });
      } else if (action === 'cancel') {
        await cancel();
      } else if (action === 'revoke') {
        await fixture.prisma.identitySession.updateMany({ where: { revokedAt: null }, data: { revokedAt: new Date() } });
      } else { res.writeHead(400).end(); return; }
      res.writeHead(204).end();
    },
    close: () => fixture.close(),
  };
};
