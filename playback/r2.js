const { S3Client, HeadObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { readAssets, KEY } = require('./assets');

/** Binds delivery to one private playback bucket with explicit server credentials. */
function createR2Delivery(env, { now = () => new Date(), client, presign = getSignedUrl } = {}) {
  const account = env.PLAYBACK_R2_ACCOUNT_ID;
  const bucket = env.PLAYBACK_R2_BUCKET;
  const jurisdiction = env.PLAYBACK_R2_JURISDICTION || 'default';
  if (!/^[a-f0-9]{32}$/.test(account || '') ||
      !/^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$/.test(bucket || '') ||
      !['default', 'eu', 'us'].includes(jurisdiction) ||
      !env.PLAYBACK_R2_ACCESS_KEY_ID?.trim() || !env.PLAYBACK_R2_SECRET_ACCESS_KEY?.trim())
    throw new Error('Invalid playback configuration');
  const assets = readAssets(env.PLAYBACK_ASSETS_FILE);
  const keys = new Set([...assets.values()].map((asset) => asset.key));
  const suffix = jurisdiction === 'default' ? '' : `.${jurisdiction}`;
  const endpoint = `https://${account}${suffix}.r2.cloudflarestorage.com`;
  const s3 = client || new S3Client({
    endpoint, region: 'auto', forcePathStyle: true, maxAttempts: 1,
    credentials: {
      accessKeyId: env.PLAYBACK_R2_ACCESS_KEY_ID,
      secretAccessKey: env.PLAYBACK_R2_SECRET_ACCESS_KEY,
    },
    requestChecksumCalculation: 'WHEN_REQUIRED',
    responseChecksumValidation: 'WHEN_REQUIRED',
  });
  return {
    /** Checks existence and rendition before the service's final authorization check. */
    async resolveAsset(trackId) {
      const asset = assets.get(trackId);
      if (!asset) return null;
      const head = await s3.send(new HeadObjectCommand({ Bucket: bucket, Key: asset.key }), {
        abortSignal: AbortSignal.timeout(5000),
      });
      if (head.ContentType !== 'audio/mpeg' || !(head.ContentLength > 0) ||
          (head.ContentEncoding && head.ContentEncoding !== 'identity'))
        throw new Error('Invalid playback object');
      return asset;
    },

    /** Signs only GET for a manifest member; arbitrary endpoints/archives are impossible. */
    async signPlayback({ asset, expiresAt }) {
      const time = now();
      const seconds = Math.floor((expiresAt - time) / 1000);
      if (!asset || Object.keys(asset).sort().join(',') !== 'contentType,key,namespace' ||
          asset.namespace !== 'playback' || asset.contentType !== 'audio/mpeg' ||
          !KEY.test(asset.key) || !keys.has(asset.key) ||
          !Number.isFinite(seconds) || seconds < 1 || seconds > 7200)
        throw new Error('Invalid playback signing request');
      return presign(s3, new GetObjectCommand({ Bucket: bucket, Key: asset.key }), {
        expiresIn: seconds, signingDate: time,
      });
    },
  };
}

module.exports = { createR2Delivery };
