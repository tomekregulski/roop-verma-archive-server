-- D9 uses existing User/request, binding and owned-attempt storage, no new table.
-- Revision rejects withdraw/re-request ABA reviews; notice is best-effort send state.
ALTER TABLE "User" ADD COLUMN "deletionRevision" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "deletionNotice" TEXT;
-- Explicit attempt tombstones permit removal of immutable request JSON only after
-- identity deletion; live attempts continue to require their original digest.
ALTER TABLE "BillingOperation" ADD COLUMN "deletedAt" TIMESTAMP(3),
  ADD COLUMN "closureCustomerId" TEXT, ADD COLUMN "closureSubscriptionId" TEXT;
