// Exact owner-approved test target; never used by normal application composition.
const { readFileSync, statSync } = require('node:fs');
const { isAbsolute } = require('node:path');
const accountId = 'a2aa7cfb44c15d74a14ca69f3a3c75f1';
const bucket = 'rvdl-private-playback-verification';
const key = 'playback/7b2da22784d895ec73f21ea2be285ffbf84536288d71c1d114cb18e515e3368e.mp3';

/** Reads only an explicit private local test file, never ambient application credentials. */
function readCredentials(filename) {
  if (!filename || !isAbsolute(filename)) throw Error('Explicit local test credentials file required');
  const info = statSync(filename);
  if (!info.isFile() || (info.mode & 0o077) !== 0 || info.size > 4096)
    throw Error('Test credentials file must be private and bounded');
  const credentials = JSON.parse(readFileSync(filename, 'utf8'));
  if (Object.keys(credentials).sort().join(',') !== 'accessKeyId,secretAccessKey' ||
      typeof credentials.accessKeyId !== 'string' || !credentials.accessKeyId.trim() ||
      typeof credentials.secretAccessKey !== 'string' || !credentials.secretAccessKey.trim())
    throw Error('Invalid test credentials file');
  return credentials;
}

module.exports = { accountId, bucket, key, readCredentials };
