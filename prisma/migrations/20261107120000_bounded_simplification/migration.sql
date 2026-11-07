BEGIN;
LOCK TABLE "TrackPlay", "NetworkError", "User", "BillingCustomer" IN ACCESS EXCLUSIVE MODE;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM "TrackPlay") THEN
    RAISE EXCEPTION 'TrackPlay contains records: owner retention/disposition required before removal';
  END IF;
  IF EXISTS (SELECT 1 FROM "NetworkError") THEN
    RAISE EXCEPTION 'NetworkError contains records: owner retention/disposition required before removal';
  END IF;
END $$;
-- Deliberately supersedes the old nullable-model/required-column diagnostic by
-- guarded removal of the entire unused store. No diagnostic rows are discarded.
DROP TABLE "TrackPlay";
DROP TABLE "NetworkError";
ALTER TABLE "User" DROP COLUMN "deletionNotice";
ALTER TABLE "BillingCustomer" DROP CONSTRAINT "BillingCustomer_access_cache_check";
UPDATE "BillingCustomer" SET "accessCheckedAt"=NULL, "accessPolicyKey"=NULL, "accessFreshUntil"=NULL;
ALTER TABLE "BillingCustomer"
  DROP COLUMN "cachedPaidFrom", DROP COLUMN "cachedPaidThrough",
  ADD COLUMN "cachedStatus" TEXT,
  ADD CONSTRAINT "BillingCustomer_access_cache_check" CHECK (
    ("accessFreshUntil" IS NULL AND "cachedStatus" IS NULL)
    OR (
      "accessFreshUntil" IS NOT NULL AND "cachedStatus" IS NOT NULL
      AND "cachedStatus" IN ('active', 'past_due')
      AND "accessCheckedAt" IS NOT NULL AND "accessPolicyKey" IS NOT NULL
      AND "selectedSubscriptionId" IS NOT NULL AND "selectedCanceledAt" IS NULL
      AND isfinite("accessCheckedAt") AND isfinite("accessFreshUntil")
      AND "accessFreshUntil" > "accessCheckedAt"
      AND "accessFreshUntil" <= "accessCheckedAt" + interval '15 minutes'
    )
  );
COMMIT;
