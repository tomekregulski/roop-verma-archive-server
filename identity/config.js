module.exports = function configuration(env = process.env) {
  let client;
  try { client = new URL(env.CLIENT_URL); }
  catch { throw new Error('CLIENT_URL must be a valid origin'); }
  const local = ['localhost', '127.0.0.1', '[::1]'].includes(client.hostname);
  if (client.username || client.password || client.search || client.hash || client.pathname !== '/' ||
      (client.protocol !== 'https:' && !(local && client.protocol === 'http:'))) {
    throw new Error('CLIENT_URL must be an HTTPS origin (HTTP loopback allowed locally)');
  }
  if (!env.AUTH_RATE_LIMIT_SECRET || env.AUTH_RATE_LIMIT_SECRET.length < 32) throw new Error('AUTH_RATE_LIMIT_SECRET must have at least 32 characters');
  if (!env.RESEND_API_KEY || !env.LOGIN_EMAIL_FROM || /[\r\n]/.test(env.LOGIN_EMAIL_FROM)) throw new Error('RESEND_API_KEY and LOGIN_EMAIL_FROM are required');
  const secure = env.SESSION_COOKIE_SECURE !== 'false';
  const sameSite = env.SESSION_COOKIE_SAME_SITE || 'lax';
  if (!['lax', 'strict', 'none'].includes(sameSite) || (!secure && (sameSite === 'none' || !local || env.NODE_ENV === 'production'))) throw new Error('Invalid session cookie configuration');
  const proxyHops = Number(env.TRUST_PROXY_HOPS || 0);
  if (!Number.isInteger(proxyHops) || proxyHops < 0 || proxyHops > 5) throw new Error('Invalid TRUST_PROXY_HOPS');
  return {
    clientOrigin: client.origin, rateSecret: env.AUTH_RATE_LIMIT_SECRET,
    resendKey: env.RESEND_API_KEY, emailFrom: env.LOGIN_EMAIL_FROM, proxyHops,
    cookieName: secure ? '__Host-rv-session' : 'rv-session-local',
    cookie: { httpOnly: true, secure, sameSite, path: '/' },
    proofMs: 15 * 60 * 1000, sessionMs: 7 * 24 * 60 * 60 * 1000,
  };
};
