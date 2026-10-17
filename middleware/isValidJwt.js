// Compatibility name only: legacy JWTs no longer authenticate requests.
module.exports = require('../identity/http').requireSession;
