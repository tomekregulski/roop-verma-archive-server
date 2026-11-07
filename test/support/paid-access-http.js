const createIdentityFixture = require('./identity-http');
const { createPaidAccess } = require('../../billing/paid-access');
const { config } = require('./billing-provider');

module.exports = async function paidAccessFixture(options = {}) {
  let access;
  const clock = () => f.clock();
  const signatures = [];
  let f;
  f = await createIdentityFixture({
    ...options,
    playbackAdapters: () => ({
      resolveAsset: async (trackId) => {
        if (f.mappingHook) await f.mappingHook();
        return {
          trackId,
          namespace: 'playback',
          key: `playback/track-${trackId}.mp3`,
          contentType: 'audio/mpeg',
        };
      },
      signPlayback: async (parameters) => {
        signatures.push(parameters);
        return 'https://synthetic.example.invalid/playback.mp3';
      },
    }),
  });
  access = f.runtime.access;
  f.signatures = signatures;
  f.access = () => access;
  f.restartAccess = () => {
    access = createPaidAccess({ db: f.prisma, stripe: f.stripe, config, now: clock,
    });
  };
  f.play = (cookie) => f.json('track/20/playback-access/synthetic-public-key', {}, cookie);
  f.binding = () => f.prisma.billingCustomer.findUnique({ where: { customerId: 'cus_test_a' },
    });
  f.select = (data = {}) =>
    f.prisma.billingCustomer.update({
      where: { customerId: 'cus_test_a' },
      data: {
        selectedSubscriptionId: 'sub_test_a',
        selectedCanceledAt: null,
        accessCheckedAt: null,
        accessPolicyKey: null,
        cachedStatus: null,
        accessFreshUntil: null,
        ...data,
      },
    });
  const reset = f.reset;
  f.reset = async () => {
    await reset();
    signatures.length = 0;
    f.mappingHook = null;
    f.restartAccess();
    if (f.prisma.tables) {
      require('./catalog-db')(f.prisma, f.calls);
      f.prisma.tables.track.push({ id: 10, public: true }, { id: 20, public: false });
      // Fill new nullable columns on the manually inserted identity fixture rows.
      if (options.select !== false) await f.select();
    }
  };
  await f.reset();
  return f;
};
