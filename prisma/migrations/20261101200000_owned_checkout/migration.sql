BEGIN;
-- Accounts exist before Stripe. No placeholder customers or selection backfill.
ALTER TABLE "User" ALTER COLUMN "stripeId" DROP NOT NULL;
ALTER TABLE "User" ADD COLUMN "deletionRequestedAt" TIMESTAMP(3);
CREATE UNIQUE INDEX "BillingOperation_checkout_session_key" ON "BillingOperation"("externalId")
  WHERE "kind" = 'checkout' AND "externalId" IS NOT NULL;
COMMIT;
