const assert = require('node:assert/strict');
const { test } = require('node:test');
const { execFile } = require('node:child_process');
const { promisify } = require('node:util');
const fs = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');
const startDemo = require('../scripts/identity-demo');
const run = promisify(execFile);
test('documented curl walkthrough works against the synthetic API/mailbox', async () => {
  const demo = await startDemo({ apiPort: 0, mailboxPort: 0 });
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'rvdl-curl-test-'));
  const jar = path.join(dir, 'cookies');
  const payload = path.join(dir, 'verify.json');
  async function curl(route, args = []) {
    const result = await run('curl', ['--silent', '--show-error', '--fail-with-body', ...args, demo.fixture.origin + '/api/v1/' + route]);
    return result.stdout ? JSON.parse(result.stdout) : null;
  }
  try {
    const response = await curl('auth/login', ['-H', 'Content-Type: application/json', '-H', 'X-RVDL-CSRF: 1', '--data', '{"email":"a@example.invalid"}']);
    assert.equal(typeof response.message, 'string');
    const mailbox = await fetch(demo.mailboxOrigin + '/latest').then(r => r.json());
    const token = new URL(mailbox.link).hash.slice(7);
    await fs.writeFile(payload, JSON.stringify({ token }), { mode: 0o600 });
    const verified = await curl('auth/verify', ['-H', 'Content-Type: application/json', '-H', 'X-RVDL-CSRF: 1', '-c', jar, '--data-binary', '@' + payload]);
    assert.equal(verified.user.id, 1);
    assert.equal((await curl('auth/session', ['-b', jar])).user.id, 1);
    assert.equal(await curl('auth/logout', ['-b', jar, '-c', jar, '-H', 'X-RVDL-CSRF: 1', '-X', 'POST']), null);
    let denied = false;
    try { await curl('auth/session', ['-b', jar]); } catch (error) { denied = error.code === 22; }
    assert.equal(denied, true);
  } finally { await demo.close(); await fs.rm(dir, { recursive: true, force: true }); }
});
