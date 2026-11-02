// Optional local tool, shared by CLI suites and the isolated browser launcher.
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const net = require('node:net');
const { randomBytes } = require('node:crypto');
const { pathToFileURL } = require('node:url');
module.exports = async function disposablePostgres() {
  const modulePath = process.env.EMBEDDED_POSTGRES_MODULE;
  if (!modulePath || !path.isAbsolute(modulePath))
    throw Error('Set EMBEDDED_POSTGRES_MODULE to optional test tool dist/index.js');
  const { default: EmbeddedPostgres } = await import(pathToFileURL(modulePath).href);
  const reservation = net.createServer();
  await new Promise((resolve, reject) => {
    reservation.once('error', reject);
    reservation.listen(0, '127.0.0.1', resolve);
  });
  const port = reservation.address().port;
  await new Promise((resolve) => reservation.close(resolve));
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'rvdl-postgres-'));
  const password = randomBytes(24).toString('hex');
  const pg = new EmbeddedPostgres({
    databaseDir: path.join(directory, 'data'),
    user: 'rvdl_identity_test',
    password,
    port,
    persistent: false,
    createPostgresUser: false,
    initdbFlags: ['--encoding=UTF8', '--locale=C'],
    postgresFlags: ['-h', '127.0.0.1', '-k', directory],
    onLog() {},
    onError() {},
  });
  const close = async () => {
    try {
      await pg.stop();
    } finally {
      await fs.rm(directory, { recursive: true, force: true });
    }
  };
  try {
    await pg.initialise();
    await pg.start();
    await pg.createDatabase('rvdl_identity_test');
    return {
      url: `postgresql://rvdl_identity_test:${password}@127.0.0.1:${port}/rvdl_identity_test?connection_limit=8`,
      close,
    };
  } catch (error) {
    await close();
    throw error;
  }
};
