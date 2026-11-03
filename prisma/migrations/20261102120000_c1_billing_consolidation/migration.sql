-- No legacy conversion or retention choice is authorized. Run a separately
-- authorized existing-data preflight BEFORE deployment. A nonempty removed table
-- is a blocker even if records look resolved: owner disposition is still needed.
BEGIN;
LOCK TABLE "User", "BillingCustomer", "BillingOperation", "Subscription",
  "CheckoutOwnership", "PaidInvoiceGrant", "StripeEventReceipt", "WebhookLog"
  IN ACCESS EXCLUSIVE MODE;
DO $$ BEGIN
 IF EXISTS (SELECT 1 FROM "CheckoutOwnership") THEN
   RAISE EXCEPTION 'C1 blocked: legacy Checkout ownership requires closure investigation and owner retention disposition';
 END IF;
 IF EXISTS (SELECT 1 FROM "Subscription") OR EXISTS (SELECT 1 FROM "PaidInvoiceGrant")
    OR EXISTS (SELECT 1 FROM "StripeEventReceipt") OR EXISTS (SELECT 1 FROM "WebhookLog") THEN
   RAISE EXCEPTION 'C1 blocked: legacy billing records require explicit owner retention disposition';
 END IF;
 IF EXISTS (SELECT 1 FROM "BillingOperation" WHERE kind <> 'checkout'
   OR ("deletedAt" IS NULL AND ("userId" IS NULL OR
       (parameters->'version') IS DISTINCT FROM '2'::jsonb))) THEN
   RAISE EXCEPTION 'C1 blocked: unsupported or orphan immutable attempts require investigation; do not erase or convert';
 END IF;
 IF EXISTS (SELECT 1 FROM "BillingCustomer" WHERE "deletionRequestedAt" IS NOT NULL
   OR "syncIssueCode" IS NOT NULL OR "reconcileCursor" IS NOT NULL) THEN
   RAISE EXCEPTION 'C1 blocked: unresolved legacy deletion/synchronization evidence requires investigation';
 END IF;
 IF EXISTS (SELECT 1 FROM "User" u LEFT JOIN "BillingCustomer" b ON b."customerId"=u."stripeId"
   WHERE u."stripeId" IS NOT NULL AND
     (b."userId" IS DISTINCT FROM u.id OR b."deletedAt" IS NOT NULL OR
      b.livemode IS NULL OR b."selectedSubscriptionId" IS NULL))
 OR EXISTS (SELECT 1 FROM "BillingCustomer" b LEFT JOIN "User" u ON u.id=b."userId"
   WHERE b."deletedAt" IS NULL AND b."stripeDeletedAt" IS NULL AND
     (u.id IS NULL OR u."stripeId" IS DISTINCT FROM b."customerId" OR
      b.livemode IS NULL OR b."selectedSubscriptionId" IS NULL)) THEN
   RAISE EXCEPTION 'C1 blocked: trusted selection/ownership preflight required; no selection backfill is permitted';
 END IF;
END $$;
DROP TABLE "PaidInvoiceGrant";
DROP TABLE "Subscription";
DROP TABLE "StripeEventReceipt";
DROP TABLE "CheckoutOwnership";
DROP TABLE "WebhookLog";
ALTER TABLE "User" DROP COLUMN "subscriptionActive";
ALTER TABLE "BillingCustomer"
  DROP COLUMN revision, DROP COLUMN "deletionRequestedAt", DROP COLUMN "lastSyncedAt",
  DROP COLUMN "syncIssueCode", DROP COLUMN "reconcileCursor", DROP COLUMN "lastFullScanAt";
ALTER TABLE "BillingOperation" DROP CONSTRAINT "BillingOperation_kind_check";
ALTER TABLE "BillingOperation" ADD CONSTRAINT "BillingOperation_kind_check" CHECK (kind = 'checkout');
COMMIT;
