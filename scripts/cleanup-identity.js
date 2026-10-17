// Run only against an explicitly selected environment. Never log row contents.
require('dotenv').config();
const { db } = require('../identity/runtime');
async function cleanup() {
  const now = new Date();
  await db.$transaction([
    db.loginProof.deleteMany({ where: { expiresAt: { lt: now } } }),
    db.identitySession.deleteMany({ where: { expiresAt: { lt: now } } }),
    db.identityRateLimit.deleteMany({ where: { expiresAt: { lt: now } } }),
  ]);
}
if (require.main === module) cleanup().then(() => console.log('Expired identity records removed'))
  .catch(() => { console.error('Identity cleanup failed'); process.exitCode = 1; })
  .finally(() => db.$disconnect());
module.exports = cleanup;
