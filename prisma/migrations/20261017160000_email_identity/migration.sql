CREATE TABLE "LoginProof" (
  "tokenHash" TEXT NOT NULL PRIMARY KEY,
  "userId" INTEGER NOT NULL,
  "email" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "delivered" BOOLEAN NOT NULL DEFAULT false,
  "consumedAt" TIMESTAMP(3),
  CONSTRAINT "LoginProof_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE "IdentitySession" (
  "tokenHash" TEXT NOT NULL PRIMARY KEY,
  "userId" INTEGER NOT NULL,
  "email" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "revokedAt" TIMESTAMP(3),
  CONSTRAINT "IdentitySession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE "CheckoutOwnership" (
  "sessionId" TEXT NOT NULL PRIMARY KEY,
  "userId" INTEGER NOT NULL,
  "customerId" TEXT NOT NULL,
  CONSTRAINT "CheckoutOwnership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE "IdentityRateLimit" (
  "key" TEXT NOT NULL PRIMARY KEY,
  "count" INTEGER NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL
);
CREATE INDEX "LoginProof_expiresAt_idx" ON "LoginProof"("expiresAt");
CREATE INDEX "IdentitySession_expiresAt_idx" ON "IdentitySession"("expiresAt");
CREATE INDEX "IdentityRateLimit_expiresAt_idx" ON "IdentityRateLimit"("expiresAt");
