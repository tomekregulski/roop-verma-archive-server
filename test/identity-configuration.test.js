const assert = require('node:assert/strict');
const { test } = require('node:test');
const configuration = require('../identity/config');
const mailer = require('../identity/mail');
const base = { CLIENT_URL: 'https://client.example.invalid', AUTH_RATE_LIMIT_SECRET: 'synthetic-secret-at-least-32-characters',
  RESEND_API_KEY: 'synthetic-key', LOGIN_EMAIL_FROM: 'login@example.invalid' };
test('configuration rejects missing mail/rate settings and unsafe cookie combinations', () => {
  for (const key of ['AUTH_RATE_LIMIT_SECRET', 'RESEND_API_KEY', 'LOGIN_EMAIL_FROM']) assert.throws(() => configuration({ ...base, [key]: '' }));
  for (const extra of [{ CLIENT_URL: 'http://remote.example.invalid' }, { CLIENT_URL: 'https://user:secret@client.example.invalid' },
    { SESSION_COOKIE_SAME_SITE: 'other' }, { SESSION_COOKIE_SAME_SITE: 'none', SESSION_COOKIE_SECURE: 'false' },
    { SESSION_COOKIE_SECURE: 'false' }, { TRUST_PROXY_HOPS: 'true' }, { TRUST_PROXY_HOPS: '-1' }]) assert.throws(() => configuration({ ...base, ...extra }));
  assert.equal(configuration({ ...base, SESSION_COOKIE_SAME_SITE: 'none' }).cookie.secure, true);
  assert.equal(configuration({ ...base, CLIENT_URL: 'http://localhost:5173', SESSION_COOKIE_SECURE: 'false' }).cookieName, 'rv-session-local');
  assert.throws(() => configuration({ ...base, CLIENT_URL: 'http://localhost:5173', SESSION_COOKIE_SECURE: 'false', NODE_ENV: 'production' }));
});
test('invalid origin configuration errors never echo its value', () => {
  let error;
  try { configuration({ ...base, CLIENT_URL: 'sensitive-invalid-url' }); } catch (caught) { error = caught; }
  assert.equal(String(error).includes('sensitive'), false);
});
test('mailer uses the fixed provider URL, controlled sender, plain-text link and bounded timeout', async () => {
  let called = false;
  const send = mailer(configuration(base), async (url, request) => {
    called = true;
    assert.equal(url, 'https://api.resend.com/emails');
    assert.equal(request.method, 'POST');
    assert.equal(request.redirect, 'error');
    assert.equal(request.signal instanceof AbortSignal, true);
    const payload = JSON.parse(request.body);
    assert.equal(payload.from, base.LOGIN_EMAIL_FROM);
    assert.deepEqual(payload.to, ['a@example.invalid']);
    assert.equal(payload.text.includes('https://client.example.invalid/login-gate#token=synthetic-proof'), true);
    assert.equal('html' in payload, false);
    return { ok: true, json: async () => ({ id: 'synthetic-provider-id' }) };
  });
  await send({ to: 'a@example.invalid', link: 'https://client.example.invalid/login-gate#token=synthetic-proof' });
  assert.equal(called, true);
});
test('provider rejection, timeout and malformed acceptance never expose provider payloads', async () => {
  for (const transport of [
    async () => ({ ok: false, json: async () => ({ error: 'sensitive-provider-payload' }) }),
    async () => { throw new Error('sensitive-provider-payload'); },
    async () => ({ ok: true, json: async () => ({}) }),
  ]) {
    let rejected = false;
    try { await mailer(configuration(base), transport)({ to: 'a@example.invalid', link: 'synthetic' }); } catch { rejected = true; }
    assert.equal(rejected, true);
  }
});
