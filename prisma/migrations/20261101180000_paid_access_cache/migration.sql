BEGIN;
-- Additive only. Selection comes from a future owned-Checkout integration, never
-- from historical status strings. No existing customer gets a selected plan/cache.
ALTER TABLE "BillingCustomer"
  ADD COLUMN "selectedSubscriptionId" TEXT,
  ADD COLUMN "selectedCanceledAt" TIMESTAMP(3),
  ADD COLUMN "accessCheckedAt" TIMESTAMP(3),
  ADD COLUMN "accessPolicyKey" TEXT,
  ADD COLUMN "cachedPaidFrom" TIMESTAMP(3),
  ADD COLUMN "cachedPaidThrough" TIMESTAMP(3),
  ADD COLUMN "accessFreshUntil" TIMESTAMP(3),
  ADD CONSTRAINT "BillingCustomer_selected_check" CHECK (
    ("selectedSubscriptionId" IS NULL OR length("selectedSubscriptionId") > 0)
    AND ("selectedCanceledAt" IS NULL OR "selectedSubscriptionId" IS NOT NULL)
  ),
  ADD CONSTRAINT "BillingCustomer_access_stamp_check" CHECK (
    ("accessCheckedAt" IS NULL) = ("accessPolicyKey" IS NULL)
  ),
  ADD CONSTRAINT "BillingCustomer_access_cache_check" CHECK (
    ("accessFreshUntil" IS NULL AND "cachedPaidFrom" IS NULL AND "cachedPaidThrough" IS NULL)
    OR (
      "accessFreshUntil" IS NOT NULL AND "cachedPaidFrom" IS NOT NULL
      AND "cachedPaidThrough" IS NOT NULL AND "accessCheckedAt" IS NOT NULL
      AND "accessPolicyKey" IS NOT NULL AND "selectedSubscriptionId" IS NOT NULL
      AND "selectedCanceledAt" IS NULL
      AND "cachedPaidFrom" < "cachedPaidThrough"
      AND "accessFreshUntil" > "accessCheckedAt"
      AND "accessFreshUntil" <= "accessCheckedAt" + interval '15 minutes'
      AND "accessFreshUntil" <= "cachedPaidThrough"
    )
  );
CREATE UNIQUE INDEX "BillingCustomer_selectedSubscriptionId_key"
  ON "BillingCustomer"("selectedSubscriptionId");
COMMIT;
