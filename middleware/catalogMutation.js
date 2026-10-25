const { noStore, requireSession, browserGuard, requireAdmin } = require('../identity/http');
const isValidApiKey = require('./isValidateApiKey');

// Authenticate against the persisted session/current User before any controller
// can write, including nested Prisma mutations. The public key is compatibility
// configuration only; it never establishes identity or administrator authority.
module.exports = [noStore, requireSession, browserGuard, isValidApiKey, requireAdmin];
