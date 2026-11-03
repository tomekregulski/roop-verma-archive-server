BEGIN;
-- Legacy strings prove no payment. Fail migration on inconsistent ownership;
-- do not guess by email or silently repair orphan subscription rows.
DO $$ BEGIN
 IF EXISTS (SELECT 1 FROM "Subscription" s LEFT JOIN "User" u ON u.id=s."userId"
            WHERE u.id IS NULL OR u."stripeId" <> s."stripeId")
 THEN RAISE EXCEPTION 'billing association repair required before migration'; END IF;
END $$;
CREATE TABLE "BillingCustomer" (
  "customerId" TEXT PRIMARY KEY CHECK (length("customerId") > 0),
  "userId" INTEGER UNIQUE REFERENCES "User"(id) ON DELETE SET NULL ON UPDATE CASCADE,
  "livemode" BOOLEAN,
  "revision" INTEGER NOT NULL DEFAULT 0 CHECK (revision >= 0),
  "deletionRequestedAt" TIMESTAMP(3),
  "deletedAt" TIMESTAMP(3),
  "stripeDeletedAt" TIMESTAMP(3),
  "lastSyncedAt" TIMESTAMP(3),
  "syncIssueCode" TEXT,
  "reconcileCursor" TEXT,
  "lastFullScanAt" TIMESTAMP(3)
);
  INSERT INTO "BillingCustomer" ("customerId", "userId") SELECT "stripeId",
  id FROM "User";
DROP INDEX "Subscription_userId_key";
ALTER TABLE "Subscription" DROP CONSTRAINT "Subscription_userId_fkey";
  ALTER TABLE "Subscription" ALTER COLUMN "userId" DROP NOT NULL,
  ADD COLUMN "acceptedAt" TIMESTAMP(3),
  ADD COLUMN "livemode" BOOLEAN,
  ADD COLUMN "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "canceledAt" TIMESTAMP(3),
  ADD COLUMN "endedAt" TIMESTAMP(3),
  ADD COLUMN "syncedAt" TIMESTAMP(3),
  ADD COLUMN "syncIssueCode" TEXT,
  ADD CONSTRAINT "Subscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"(id) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "Subscription_stripeId_fkey" FOREIGN KEY ("stripeId") REFERENCES "BillingCustomer"("customerId") ON DELETE RESTRICT ON UPDATE CASCADE,
 ADD CONSTRAINT "Subscription_id_nonempty" CHECK (length(id) > 0);
CREATE INDEX "Subscription_stripeId_status_idx" ON "Subscription"("stripeId", status);
CREATE TABLE "PaidInvoiceGrant" (
  "invoiceId" TEXT PRIMARY KEY CHECK (length("invoiceId") > 0),
  "invoiceLineId" TEXT NOT NULL UNIQUE CHECK (length("invoiceLineId") > 0),
  "subscriptionId" TEXT NOT NULL REFERENCES "Subscription"(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  "priceId" TEXT NOT NULL CHECK (length("priceId") > 0),
  "serviceFrom" TIMESTAMP(3) NOT NULL,
  "serviceThrough" TIMESTAMP(3) NOT NULL,
  "settledAt" TIMESTAMP(3) NOT NULL,
  "paymentIntentId" TEXT NOT NULL UNIQUE CHECK (length("paymentIntentId") > 0),
  "chargeId" TEXT NOT NULL UNIQUE CHECK (length("chargeId") > 0),
  currency TEXT NOT NULL,
  "amountPaid" INTEGER NOT NULL CHECK ("amountPaid" > 0),
  "invalidatedAt" TIMESTAMP(3),
  "invalidationReason" TEXT,
  "disputeId" TEXT,
  "reviewReason" TEXT,
  "verifiedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PaidInvoiceGrant_period_check" CHECK ("serviceThrough" > "serviceFrom"),
 CONSTRAINT "PaidInvoiceGrant_invalidation_check" CHECK (("invalidatedAt" IS NULL) = ("invalidationReason" IS NULL))
);
CREATE INDEX "PaidInvoiceGrant_subscriptionId_serviceThrough_idx" ON "PaidInvoiceGrant"("subscriptionId", "serviceThrough");
CREATE TABLE "StripeEventReceipt" (
  "eventId" TEXT PRIMARY KEY CHECK (length("eventId") > 0),
  type TEXT NOT NULL,
  "objectId" TEXT NOT NULL,
  "apiVersion" TEXT,
  livemode BOOLEAN,
  "eventCreatedAt" TIMESTAMP(3),
  "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  outcome TEXT NOT NULL DEFAULT 'pending' CHECK (outcome IN ('pending','applied','ignored','review')),
  "appliedAt" TIMESTAMP(3),
  attempts INTEGER NOT NULL DEFAULT 0,
  "errorCode" TEXT,
  "lastAttemptAt" TIMESTAMP(3)
);
CREATE INDEX "StripeEventReceipt_outcome_receivedAt_idx" ON "StripeEventReceipt"(outcome, "receivedAt");
CREATE TABLE "BillingOperation" (
  id TEXT PRIMARY KEY,
  "activeKey" TEXT UNIQUE,
  kind TEXT NOT NULL CHECK (kind IN ('registration','checkout')),
  "userId" INTEGER REFERENCES "User"(id) ON DELETE SET NULL ON UPDATE CASCADE,
  "customerId" TEXT,
  digest TEXT NOT NULL,
  parameters JSONB NOT NULL,
  state TEXT NOT NULL DEFAULT 'pending' CHECK (state IN ('pending','completed','review')),
  "externalId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completedAt" TIMESTAMP(3)
);

-- Partial admission uniqueness is an application invariant Prisma 4 cannot model.
CREATE UNIQUE INDEX "Subscription_one_ongoing_accepted" ON "Subscription"("stripeId")
 WHERE "acceptedAt" IS NOT NULL AND status NOT IN ('canceled', 'incomplete_expired');
COMMIT;
