// Standalone, synthetic-only API/mailbox. Never used by index.js or production.
const http = require('node:http');
const createFixture = require('../test/support/identity-http');
async function startDemo({ apiPort = 8090, mailboxPort = 8091 } = {}) {
  if (process.env.NODE_ENV === 'production') throw new Error('Synthetic demo refuses production mode');
  const fixture = await createFixture({ port: apiPort, configuration: { CLIENT_URL: 'http://localhost:5173', SESSION_COOKIE_SECURE: 'false' } });
  const mailbox = http.createServer((req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Content-Type', 'application/json');
    // No CORS: the mailbox is a local manual testing aid, not a browser API.
    if (req.method !== 'GET' || req.url !== '/latest') { res.writeHead(404).end('{}'); return; }
    if (!fixture.mail.length) { res.writeHead(404).end('{}'); return; }
    res.end(JSON.stringify(fixture.mail.at(-1)));
  });
  try {
    await new Promise((resolve, reject) => { mailbox.once('error', reject); mailbox.listen(mailboxPort, '127.0.0.1', resolve); });
  } catch (error) { await fixture.close(); throw error; }
  return { fixture, mailboxOrigin: 'http://127.0.0.1:' + mailbox.address().port,
    close: async () => { await new Promise(resolve => mailbox.close(resolve)); await fixture.close(); } };
}
if (require.main === module) {
  startDemo().then(demo => {
    console.log('Synthetic API: ' + demo.fixture.origin);
    console.log('Synthetic mailbox: ' + demo.mailboxOrigin + '/latest');
    console.log('Accounts: a@example.invalid, b@example.invalid, admin@example.invalid. No real services.');
    const close = () => demo.close().then(() => process.exit(0));
    process.once('SIGINT', close); process.once('SIGTERM', close);
  }).catch(() => { console.error('Could not start synthetic demo; check local ports and NODE_ENV'); process.exitCode = 1; });
}
module.exports = startDemo;
