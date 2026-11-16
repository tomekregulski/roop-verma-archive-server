// Explicit approved synthetic-object checks only. Not part of npm test or app startup.
const assert = require('node:assert/strict');
const { S3Client, HeadObjectCommand, GetObjectCommand, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { accountId, bucket, key, readCredentials } = require('./support/r2-sample');
let stage = 'configuration';

/** Emits only fixed check labels and status codes, never URLs or provider errors. */
function report(name, status) {
  console.log(JSON.stringify({ check: name, pass: true, ...(status ? { status } : {}) }));
}

/** Performs one bounded fresh request without retaining its media response body. */
async function request(url, options = {}) {
  const response = await fetch(url, {
    ...options, signal: AbortSignal.timeout(10000),
    headers: { Origin: 'http://127.0.0.1:3180', 'Cache-Control': 'no-cache', ...options.headers },
  });
  await response.body?.cancel();
  return response;
}

/** Confirms the approved read credential cannot write/delete even in its test bucket. */
async function deniedCommand(client, command) {
  let status;
  try { await client.send(command, { abortSignal: AbortSignal.timeout(10000) }); }
  catch (error) { status = error.$metadata?.httpStatusCode; }
  assert.equal(status, 403);
}

/** Checks real private delivery and expiration for only the generated sample. */
async function main() {
  if (process.env.NODE_ENV === 'production') throw Error('Provider check refuses production');
  const credentials = readCredentials(process.argv[2]);
  const client = new S3Client({
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`, region: 'auto', forcePathStyle: true,
    credentials, maxAttempts: 1, requestChecksumCalculation: 'WHEN_REQUIRED', responseChecksumValidation: 'WHEN_REQUIRED',
  });
  try {
    stage = 'object metadata';
    const metadata = await client.send(new HeadObjectCommand({ Bucket: bucket, Key: key }), { abortSignal: AbortSignal.timeout(10000) });
    assert.equal(metadata.ContentType, 'audio/mpeg');
    assert.equal(metadata.ContentLength, 7200600);
    assert.ok(!metadata.ContentEncoding || metadata.ContentEncoding === 'identity');
    report(stage);

    stage = 'two-hour GET capability';
    const command = new GetObjectCommand({ Bucket: bucket, Key: key });
    const url = await getSignedUrl(client, command, { expiresIn: 7200 });
    assert.equal(new URL(url).searchParams.get('X-Amz-Expires'), '7200');
    report(stage);

    stage = 'nonzero range and allowed browser origin';
    const range = await request(url, { headers: { Range: 'bytes=100000-101023' } });
    assert.equal(range.status, 206);
    assert.equal(range.headers.get('content-range'), 'bytes 100000-101023/7200600');
    assert.equal(range.headers.get('access-control-allow-origin'), 'http://127.0.0.1:3180');
    report(stage, range.status);

    stage = 'unsigned request denied';
    const unsigned = new URL(url); unsigned.search = '';
    const unsignedResponse = await request(unsigned);
    // R2 rejects missing S3 authentication as 400; invalid signatures use 403.
    assert.ok([400, 401, 403].includes(unsignedResponse.status));
    assert.notEqual(unsignedResponse.headers.get('content-type'), 'audio/mpeg');
    report(stage, unsignedResponse.status);

    stage = 'altered object denied';
    const wrong = new URL(url); wrong.pathname += '.wrong';
    assert.equal((await request(wrong)).status, 403); report(stage, 403);

    stage = 'altered signature denied';
    const wrongSignature = new URL(url);
    const signature = wrongSignature.searchParams.get('X-Amz-Signature');
    wrongSignature.searchParams.set('X-Amz-Signature', `${signature[0] === '0' ? '1' : '0'}${signature.slice(1)}`);
    assert.equal((await request(wrongSignature)).status, 403); report(stage, 403);

    stage = 'altered expiry denied';
    const wrongExpiry = new URL(url); wrongExpiry.searchParams.set('X-Amz-Expires', '7201');
    assert.equal((await request(wrongExpiry)).status, 403); report(stage, 403);

    stage = 'GET capability cannot PUT';
    assert.equal((await request(url, { method: 'PUT', body: '' })).status, 403); report(stage, 403);

    stage = 'read credential cannot write';
    const absent = 'playback/synthetic-denied-permission-probe';
    await deniedCommand(client, new PutObjectCommand({ Bucket: bucket, Key: absent, Body: Buffer.alloc(0), ContentLength: 0 })); report(stage, 403);
    stage = 'read credential cannot delete';
    await deniedCommand(client, new DeleteObjectCommand({ Bucket: bucket, Key: absent })); report(stage, 403);

    stage = 'separate five-second expiry probe';
    const short = await getSignedUrl(client, command, { expiresIn: 5 });
    assert.equal((await request(short, { headers: { Range: 'bytes=0-1023' } })).status, 206);
    await new Promise((resolve) => setTimeout(resolve, 6500));
    const expired = await request(short, { headers: { Range: 'bytes=0-1023' } });
    assert.equal(expired.status, 403); report(stage, expired.status);
  } finally { client.destroy(); }
}

main().catch((error) => {
  console.error(JSON.stringify({ check: stage, pass: false,
    ...(typeof error.$metadata?.httpStatusCode === 'number' ? { status: error.$metadata.httpStatusCode } : {}),
    ...(typeof error.actual === 'number' ? { actual: error.actual } : {}),
    ...(typeof error.expected === 'number' ? { expected: error.expected } : {}),
  }));
  process.exitCode = 1;
});
