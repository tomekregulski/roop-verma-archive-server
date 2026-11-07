const { failure } = require('../identity/service');
const URL_LIFETIME_MS = 2 * 60 * 60 * 1000;

// Only normalized, bounded status evidence from the server reader can authorize.
function accessAt(entitlement, userId, time) {
  return (
    entitlement &&
    !Array.isArray(entitlement) &&
    entitlement.kind === 'subscription' &&
    entitlement.userId === userId &&
    ['active', 'past_due'].includes(entitlement.status) &&
    Object.keys(entitlement).every((key) =>
      ['kind', 'userId', 'status', 'checkedAt', 'freshUntil'].includes(key)
    ) &&
    entitlement.checkedAt instanceof Date &&
    entitlement.freshUntil instanceof Date &&
    entitlement.checkedAt <= time &&
    time < entitlement.freshUntil &&
    entitlement.freshUntil - entitlement.checkedAt <= 15 * 60 * 1000
  );
}

// Adapters are server supplied; request telemetry never grants playback authority.
function createPlayback({
  db,
  identity,
  readEntitlement,
  resolveAsset,
  signPlayback,
  now = () => new Date(),
}) {
  return async function issue({ trackId, credential }) {
    const track = await db.track.findUnique({ where: { id: trackId }, select: { id: true, public: true },
    });
    if (!track) throw failure(404, 'Track not found');
    if (track.public !== true && track.public !== false) throw failure(503, 'Track visibility unavailable');

    // Public means everyone: cookies cannot gate public tracks. Subscriber
    // issuance alone requires persisted, currently valid session authority.
    const session = !track.public ? await identity.authenticate(credential) : null;
    let entitlement;

    if (!track.public) {
      try {
        entitlement = await readEntitlement(session.user.id);
      } catch (error) {
        require('../handlers/log').logFailure('playback.access', error);
        throw failure(
          503,
          'Unable to check playback access. Retry or contact support.'
        );
      }
    }
    if (!track.public && !accessAt(entitlement, session.user.id, now())) {
      throw failure(403,
        'A current subscription is required. Manage billing in your account.'
      );
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

    // Reread persisted authority after mapping; logout and revocation must also win.
    if (!track.public) {
      await identity.authenticate(credential);
      try {
        entitlement = await readEntitlement(session.user.id);
      } catch (error) {
        require('../handlers/log').logFailure('playback.access', error);
        throw failure(
          503,
          'Unable to check playback access. Retry or contact support.'
        );
      }
    }
    // Recheck freshness immediately before signing.
    const time = now();
    if (!track.public && !accessAt(entitlement, session.user.id, time))
      throw failure(403,
        'A current subscription is required. Manage billing in your account.'
      );
    const expiresAt = new Date(time.getTime() + URL_LIFETIME_MS);

    let url;
    try {
      url = await signPlayback({
        asset: { namespace: 'playback', key: asset.key, contentType: 'audio/mpeg',
        },
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
