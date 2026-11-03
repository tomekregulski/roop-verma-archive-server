// Optional test-tool dependency, intentionally outside application dependencies.
// Start a fresh loopback-only cluster, run the HTTP integration suite, stop it.
const path = require('node:path');
const { spawn } = require('node:child_process');
async function main() {
  const pg = await require('../test/support/disposable-postgres')();
  try {
    console.log('Disposable loopback PostgreSQL ready; mail and Stripe are synthetic');
    const code = await new Promise((resolve, reject) => {
      const suites = ['test/integration/identity.postgres.js'];
      if (process.argv.includes('--billing'))
        suites.push('test/integration/consolidation.postgres.js');
      if (process.argv.includes('--billing') || process.argv.includes('--paid-access'))
        suites.push('test/integration/paid-access.postgres.js');
      if (process.argv.includes('--billing') || process.argv.includes('--purchase'))
        suites.push('test/integration/purchase.postgres.js');
      if (
        process.argv.includes('--billing') ||
        process.argv.includes('--purchase') ||
        process.argv.includes('--deletion')
      )
        suites.push('test/integration/deletion.postgres.js');
      const child = spawn(process.execPath, ['--test', '--test-timeout=45000', ...suites], {
        cwd: path.resolve(__dirname, '..'),
        stdio: 'inherit',
        env: {
          ...process.env,
          RVDL_ASSESS_FULL_SCHEMA: process.argv.includes('--assess-schema') ? '1' : '0',
          TEST_DATABASE_URL: pg.url,
        },
      });
      child.once('error', reject);
      child.once('exit', resolve);
    });
    return code === 0 ? 0 : 1;
  } finally {
    await pg.close();
  }
}
// The optional tool's beforeExit hook defaults to exit(0). Preserve the test
// runner result explicitly, after the cluster has been stopped in finally.
main()
  .then((code) => process.exit(code))
  .catch((error) => {
    console.error(
      'Disposable PostgreSQL check failed: ' + (error.code || 'see local test prerequisites')
    );
    process.exit(1);
  });
