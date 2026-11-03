// Shared local account serialization. Never hold this lock across provider calls.
async function lockAccount(tx, userId) {
  const scope = 'purchase:user:' + userId;
  await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtextextended(${scope}, 0))::text`;
  await tx.$queryRaw`SELECT "id" FROM "User" WHERE "id" = ${userId} FOR UPDATE`;
}
module.exports = { lockAccount };
