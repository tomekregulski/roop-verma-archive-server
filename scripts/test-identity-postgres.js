// Optional test-tool dependency, intentionally outside application dependencies.
// Start a fresh loopback-only cluster, run the HTTP integration suite, stop it.
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const net = require('node:net');
const { randomBytes } = require('node:crypto');
const { pathToFileURL } = require('node:url');
const { spawn } = require('node:child_process');
async function main() {
  const modulePath = process.env.EMBEDDED_POSTGRES_MODULE;
  if (!modulePath || !path.isAbsolute(modulePath)) throw new Error('Set EMBEDDED_POSTGRES_MODULE to the optional test tool dist/index.js');
  const { default: EmbeddedPostgres } = await import(pathToFileURL(modulePath).href);
  const reservation = net.createServer();
  await new Promise((resolve, reject) => { reservation.once('error', reject); reservation.listen(0, '127.0.0.1', resolve); });
  const port = reservation.address().port;
  await new Promise(resolve => reservation.close(resolve));
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'rvdl-postgres-'));
  const password = randomBytes(24).toString('hex');
  const pg = new EmbeddedPostgres({
    databaseDir: path.join(directory, 'data'), user: 'rvdl_identity_test', password,
    port, persistent: false, createPostgresUser: false,
    initdbFlags: ['--encoding=UTF8', '--locale=C'],
    postgresFlags: ['-h', '127.0.0.1', '-k', directory],
    onLog() {}, onError() {},
  });
  try {
    await pg.initialise();
    await pg.start();
    await pg.createDatabase('rvdl_identity_test');
    console.log('Disposable loopback PostgreSQL ready; mail and Stripe are synthetic');
    const code = await new Promise((resolve, reject) => {
      const child = spawn(process.execPath, ['--test', 'test/integration/identity.postgres.js'], {
        cwd: path.resolve(__dirname, '..'), stdio: 'inherit',
        env: { ...process.env,
          RVDL_ASSESS_FULL_SCHEMA: process.argv.includes('--assess-schema') ? '1' : '0',
          TEST_DATABASE_URL: `postgresql://rvdl_identity_test:${password}@127.0.0.1:${port}/rvdl_identity_test?connection_limit=8` },
      });
      child.once('error', reject); child.once('exit', resolve);
    });
    return code === 0 ? 0 : 1;
  } finally {
    try { await pg.stop(); }
    finally { await fs.rm(directory, { recursive: true, force: true }); }
  }
}
// The optional tool's beforeExit hook defaults to exit(0). Preserve the test
// runner result explicitly, after the cluster has been stopped in finally.
main().then(code => process.exit(code)).catch(error => {
  console.error('Disposable PostgreSQL check failed: ' + (error.code || 'see local test prerequisites'));
  process.exit(1);
});
