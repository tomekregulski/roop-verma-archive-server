const { createHash, createHmac, randomBytes } = require('node:crypto');
const { setTimeout: delay } = require('node:timers/promises');
const hash = value => createHash('sha256').update(value).digest('hex');
const credential = () => randomBytes(32).toString('base64url');
const validCredential = value => typeof value === 'string' && /^[A-Za-z0-9_-]{43}$/.test(value);
const failure = (status, message) => Object.assign(new Error(message), { status });
const publicUser = user => ({
  id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName,
  stripeId: user.stripeId, subscriptionActive: user.subscriptionActive, isAdmin: user.isAdmin,
});
function emailAddress(value) {
  if (typeof value !== 'string') throw failure(400, 'Invalid email address');
  const email = value.trim();
  if (email.length > 254 || !/^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9](?:[A-Za-z0-9.-]*[A-Za-z0-9])?\.[A-Za-z]{2,63}$/.test(email) ||
      email.split('@')[0].length > 64 || email.includes('..')) throw failure(400, 'Invalid email address');
  return email;
}

function createIdentity({ db, config, sendEmail, now = () => new Date(), wait = delay, responseFloorMs = 5500 }) {
  async function limit(scope, subject, maximum, durationMs) {
    const bucket = Math.floor(now().getTime() / durationMs);
    const key = createHmac('sha256', config.rateSecret).update(`${scope}:${subject}:${bucket}`).digest('hex');
    const expiresAt = new Date((bucket + 1) * durationMs);
    const rows = await db.$queryRaw`
      INSERT INTO "IdentityRateLimit" ("key", "count", "expiresAt") VALUES (${key}, 1, ${expiresAt})
      ON CONFLICT ("key") DO UPDATE SET "count" = LEAST("IdentityRateLimit"."count" + 1, ${maximum + 1})
      RETURNING "count"`;
    if (rows[0].count > maximum) throw failure(429, 'Too many requests; try again later');
  }
  async function requestLogin(email, ip) {
    await limit('login-ip', ip, 20, config.proofMs);
    await limit('login-email', email.toLowerCase(), 5, config.proofMs);
    await limit('login-global', 'all', 120, 60 * 1000);
    const started = Date.now();
    try {
      // Preserve existing case; ambiguous case-duplicate records require reconciliation.
      const users = await db.user.findMany({ where: { email: { equals: email, mode: 'insensitive' } }, take: 2 });
      if (users.length !== 1) return;
      const user = users[0];
      const token = credential();
      const tokenHash = hash(token);
      await db.loginProof.create({ data: {
        tokenHash, userId: user.id, email: user.email,
        expiresAt: new Date(now().getTime() + config.proofMs),
      } });
      try {
        await sendEmail({ to: user.email, link: `${config.clientOrigin}/login-gate#token=${token}` });
        await db.loginProof.updateMany({ where: { tokenHash, consumedAt: null }, data: { delivered: true } });
      } catch {
        // A pending proof cannot be exchanged, including after an ambiguous timeout.
        console.warn('login_delivery_failed');
        await db.loginProof.deleteMany({ where: { tokenHash, delivered: false } });
      }
    } finally {
      // Reduce timing signals across normal lookup/send latency and provider timeout.
      // This is a response floor, not a constant-time guarantee under DB/network stalls.
      await wait(Math.max(0, responseFloorMs - (Date.now() - started)));
    }
  }
  async function verify(token, ip, previousSession) {
    await limit('verify-ip', ip, 60, config.proofMs);
    if (!validCredential(token)) throw failure(401, 'Invalid or expired login link');
    const tokenHash = hash(token);
    const rawSession = credential();
    const expiresAt = new Date(now().getTime() + config.sessionMs);
    const user = await db.$transaction(async tx => {
      const proof = await tx.loginProof.findUnique({ where: { tokenHash } });
      if (!proof) throw failure(401, 'Invalid or expired login link');
      const current = await tx.user.findUnique({ where: { id: proof.userId } });
      if (!current || current.email !== proof.email) throw failure(401, 'Invalid or expired login link');
      // PostgreSQL rechecks this predicate after a competing update commits.
      const consumed = await tx.loginProof.updateMany({
        where: { tokenHash, delivered: true, consumedAt: null, expiresAt: { gt: now() } },
        data: { consumedAt: now() },
      });
      if (consumed.count !== 1) throw failure(401, 'Invalid or expired login link');
      await tx.identitySession.create({ data: { tokenHash: hash(rawSession), userId: current.id, email: current.email, expiresAt } });
      if (validCredential(previousSession)) await tx.identitySession.updateMany({
        where: { tokenHash: hash(previousSession), revokedAt: null }, data: { revokedAt: now() },
      });
      return current;
    });
    return { rawSession, expiresAt, user: publicUser(user) };
  }
  async function authenticate(token) {
    if (!validCredential(token)) throw failure(401, 'Authentication required');
    const session = await db.identitySession.findUnique({ where: { tokenHash: hash(token) }, include: { user: true } });
    if (!session || session.revokedAt || session.expiresAt <= now() || !session.user || session.user.email !== session.email) throw failure(401, 'Authentication required');
    return session;
  }
  async function logout(token) {
    if (validCredential(token)) await db.identitySession.updateMany({
      where: { tokenHash: hash(token), revokedAt: null }, data: { revokedAt: now() },
    });
  }
  return { requestLogin, verify, authenticate, logout, limit };
}
module.exports = { createIdentity, emailAddress, hash, publicUser, failure };
