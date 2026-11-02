const createIdentityFixture = require('./identity-http');
const { createEntitlementReader } = require('../../billing/reader');
module.exports = async function billingFixture(options = {}) {
  let f;
  const signatures = [];
  f = await createIdentityFixture({
    ...options,
    playbackAdapters: ({ db, now }) => ({
      readEntitlement: createEntitlementReader({
        db,
        config: options.billingConfiguration || require('./billing-provider').config,
        now,
      }),
      resolveAsset: async (trackId) => {
        if (f.mappingHook) await f.mappingHook();
        return {
          trackId,
          namespace: 'playback',
          key: `playback/track-${trackId}.mp3`,
          contentType: 'audio/mpeg',
        };
      },
      signPlayback: async (params) => {
        signatures.push(params);
        return 'https://synthetic.example.invalid/playback.mp3';
      },
    }),
  });
  f.signatures = signatures;
  const reset = f.reset;
  f.reset = async () => {
    await reset();
    signatures.length = 0;
    f.mappingHook = null;
    if (f.prisma.tables) {
      // Only catalog data is a fixture; billing authority always runs the real path.
      f.prisma.tables.subscription.length = 0;
      require('./catalog-db')(f.prisma, f.calls);
      f.prisma.tables.track.push({ id: 10, public: true }, { id: 20, public: false });
    }
  };
  await f.reset();
  return f;
};
