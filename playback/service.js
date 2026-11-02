const { failure } = require('../identity/service');
const URL_LIFETIME_MS = 2 * 60 * 60 * 1000;

// Accept only an explicit paid interval for this user, including its start but
// excluding its end. Cancellation preserves access through that paid interval;
// malformed, ambiguous or unapproved entitlement shapes cannot grant access.
function paidAt(entitlement, userId, time) {
  return (
    entitlement &&
    !Array.isArray(entitlement) &&
    entitlement.kind === 'paid' &&
    entitlement.userId === userId &&
    Object.keys(entitlement).every((key) =>
      ['kind', 'userId', 'paidFrom', 'paidThrough', 'cancelled'].includes(key)
    ) &&
    (entitlement.cancelled === undefined || typeof entitlement.cancelled === 'boolean') &&
    entitlement.paidFrom instanceof Date &&
    entitlement.paidThrough instanceof Date &&
    entitlement.paidFrom.getTime() <= time.getTime() &&
    time.getTime() < entitlement.paidThrough.getTime()
  );
}

// Adapters are supplied by server composition, never request input. Entitlements
// are normalized paid intervals, not Stripe status strings or User display fields.
function createPlayback({
  db,
  identity,
  readEntitlement,
  resolveAsset,
  signPlayback,
  now = () => new Date(),
}) {
  return async function issue({ trackId, credential }) {
    const track = await db.track.findUnique({ where: { id: trackId }, select: { id: true, public: true } });
    if (!track) throw failure(404, 'Track not found');
    if (track.public !== true && track.public !== false) throw failure(503, 'Track visibility unavailable');

    // Public means everyone: cookies cannot gate public tracks. Subscriber
    // issuance alone requires persisted, currently valid session authority.
    const session = !track.public ? await identity.authenticate(credential) : null;
    let entitlement;

    if (!track.public) {
      try {
        entitlement = await readEntitlement(session.user.id);
      } catch {
        throw failure(503, 'Playback entitlement unavailable');
      }
    }
    if (!track.public && !paidAt(entitlement, session.user.id, now())) {
      throw failure(403, 'Current paid subscription required');
    }

    // This mapping is independent of the legacy Track.url. Only the playback
    // namespace and MP3 rendition can cross the signing boundary; no bucket input.
    let asset;
    try {
      asset = await resolveAsset(track.id);
    } catch {
      throw failure(503, 'Playback delivery unavailable');
    }
    if (
      !asset ||
      asset.trackId !== track.id ||
      asset.namespace !== 'playback' ||
      asset.contentType !== 'audio/mpeg' ||
      typeof asset.key !== 'string' ||
      !/^playback\/[A-Za-z0-9_-]+\.mp3$/.test(asset.key)
    ) {
      throw failure(503, 'Playback delivery unavailable');
    }

    // Reread persisted authority after asynchronous mapping; a cached interval
    // cannot detect a refund/dispute committed while mapping awaited.
    if (!track.public) {
      try {
        entitlement = await readEntitlement(session.user.id);
      } catch {
        throw failure(503, 'Playback entitlement unavailable');
      }
    }
    // Recheck the exclusive paid boundary immediately before signing.
    const time = now();
    if (!track.public && !paidAt(entitlement, session.user.id, time))
      throw failure(403, 'Current paid subscription required');
    const expiresAt = new Date(time.getTime() + URL_LIFETIME_MS);

    let url;
    try {
      url = await signPlayback({
        asset: { namespace: 'playback', key: asset.key, contentType: 'audio/mpeg' },
        expiresAt,
      });
      if (typeof url !== 'string') throw new Error('Invalid signed URL');
      const parsed = new URL(url);
      if (parsed.protocol !== 'https:' || parsed.username || parsed.password)
        throw new Error('Invalid signed URL');
    } catch {
      throw failure(503, 'Playback delivery unavailable');
    }
    return { trackId: track.id, url, expiresAt: expiresAt.toISOString() };
  };
}
module.exports = { createPlayback, URL_LIFETIME_MS };
