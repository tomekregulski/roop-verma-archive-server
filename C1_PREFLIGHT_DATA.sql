-- PROPOSED ONLY. Run AFTER schema/ledger review on the authorized local copy.
-- Aggregate counts only. Missing relations/columns yield NOT EVALUATED, not zero.
-- All identifiers and query bodies below are fixed reviewed literals.
\set ON_ERROR_STOP on
\set ECHO none
\pset pager off
SELECT current_database() = 'rvdl_c1_b004'
   AND current_setting('application_name') = 'rvdl-c1-b004-preflight'
   AND inet_server_addr() IS NULL AS approved_target
\gset
\if :approved_target
\else
  \echo 'Refusing target: use the approved database and private Unix socket.'
  -- A constant error makes ON_ERROR_STOP exit nonzero; \quit ignores exit codes.
  SELECT 1 / 0 AS refusing_unapproved_target;
  \quit
\endif

BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY;
SET LOCAL search_path = pg_catalog;
SET LOCAL statement_timeout = '5s';
SET LOCAL lock_timeout = '1s';

-- The first nine predicates reproduce the C1 removal guard. Other predicates
-- identify earlier migration/identity issues and preservation obligations.
WITH checks(check_name, required, query) AS (VALUES
 ('c1_checkout_ownership_rows', '{"CheckoutOwnership":[]}'::jsonb,
  'SELECT count(*) FROM public."CheckoutOwnership"'),
 ('c1_subscription_rows', '{"Subscription":[]}'::jsonb,
  'SELECT count(*) FROM public."Subscription"'),
 ('c1_paid_invoice_grant_rows', '{"PaidInvoiceGrant":[]}'::jsonb,
  'SELECT count(*) FROM public."PaidInvoiceGrant"'),
 ('c1_event_receipt_rows', '{"StripeEventReceipt":[]}'::jsonb,
  'SELECT count(*) FROM public."StripeEventReceipt"'),
 ('c1_webhook_log_rows', '{"WebhookLog":[]}'::jsonb,
  'SELECT count(*) FROM public."WebhookLog"'),
 ('c1_unsupported_or_orphan_attempts',
  '{"BillingOperation":["kind","deletedAt","userId","parameters"]}'::jsonb,
  $q$SELECT count(*) FROM public."BillingOperation" WHERE kind <> 'checkout'
    OR ("deletedAt" IS NULL AND ("userId" IS NULL
      OR (parameters->'version') IS DISTINCT FROM '2'::jsonb))$q$),
 ('c1_legacy_customer_flags',
  '{"BillingCustomer":["deletionRequestedAt","syncIssueCode","reconcileCursor"]}'::jsonb,
  'SELECT count(*) FROM public."BillingCustomer" WHERE "deletionRequestedAt" IS NOT NULL
    OR "syncIssueCode" IS NOT NULL OR "reconcileCursor" IS NOT NULL'),
 ('c1_user_binding_selection_failures',
  '{"User":["id","stripeId"],"BillingCustomer":["customerId","userId","deletedAt","livemode","selectedSubscriptionId"]}'::jsonb,
  'SELECT count(*) FROM public."User" u LEFT JOIN public."BillingCustomer" b ON b."customerId"=u."stripeId"
    WHERE u."stripeId" IS NOT NULL AND (b."userId" IS DISTINCT FROM u.id
      OR b."deletedAt" IS NOT NULL OR b.livemode IS NULL OR b."selectedSubscriptionId" IS NULL)'),
 ('c1_live_customer_ownership_selection_failures',
  '{"User":["id","stripeId"],"BillingCustomer":["userId","customerId","deletedAt","stripeDeletedAt","livemode","selectedSubscriptionId"]}'::jsonb,
  'SELECT count(*) FROM public."BillingCustomer" b LEFT JOIN public."User" u ON u.id=b."userId"
    WHERE b."deletedAt" IS NULL AND b."stripeDeletedAt" IS NULL AND
      (u.id IS NULL OR u."stripeId" IS DISTINCT FROM b."customerId"
       OR b.livemode IS NULL OR b."selectedSubscriptionId" IS NULL)'),
 ('earlier_billing_migration_subscription_ownership_failures',
  '{"Subscription":["userId","stripeId"],"User":["id","stripeId"]}'::jsonb,
  'SELECT count(*) FROM public."Subscription" s LEFT JOIN public."User" u ON u.id=s."userId"
    WHERE u.id IS NULL OR u."stripeId" <> s."stripeId"'),
 ('diagnostic_normalized_email_duplicate_groups', '{"User":["email"]}'::jsonb,
  'SELECT count(*) FROM (SELECT 1 FROM public."User" WHERE email IS NOT NULL
    GROUP BY lower(btrim(email)) HAVING count(*) > 1) duplicates'),
 ('diagnostic_blank_or_null_emails', '{"User":["email"]}'::jsonb,
  'SELECT count(*) FROM public."User" WHERE email IS NULL OR btrim(email) = '''''),
 ('preserve_deleted_attempt_tombstones', '{"BillingOperation":["deletedAt"]}'::jsonb,
  'SELECT count(*) FROM public."BillingOperation" WHERE "deletedAt" IS NOT NULL'),
 ('preserve_customer_tombstones', '{"BillingCustomer":["deletedAt","stripeDeletedAt"]}'::jsonb,
  'SELECT count(*) FROM public."BillingCustomer" WHERE "deletedAt" IS NOT NULL OR "stripeDeletedAt" IS NOT NULL'),
 ('preserve_pending_account_deletion_requests', '{"User":["deletionRequestedAt"]}'::jsonb,
  'SELECT count(*) FROM public."User" WHERE "deletionRequestedAt" IS NOT NULL'),
 ('review_live_owned_attempts', '{"BillingOperation":["deletedAt"]}'::jsonb,
  'SELECT count(*) FROM public."BillingOperation" WHERE "deletedAt" IS NULL'),
 ('review_live_associations', '{"BillingCustomer":["deletedAt","stripeDeletedAt"]}'::jsonb,
  'SELECT count(*) FROM public."BillingCustomer" WHERE "deletedAt" IS NULL AND "stripeDeletedAt" IS NULL')
), ready AS (
  SELECT checks.*, NOT EXISTS (
    SELECT 1 FROM jsonb_each(checks.required) dep WHERE NOT EXISTS (
      SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public' AND c.relname = dep.key AND c.relkind IN ('r', 'p')
        AND NOT EXISTS (
          SELECT 1 FROM jsonb_array_elements_text(dep.value) col(name)
          WHERE NOT EXISTS (SELECT 1 FROM pg_attribute a WHERE a.attrelid = c.oid
            AND a.attname = col.name AND a.attnum > 0 AND NOT a.attisdropped))
    )
  ) AS can_evaluate FROM checks
)
SELECT CASE WHEN can_evaluate THEN format(
  'SELECT %L AS check_name, %L AS status, (%s)::bigint AS affected_count',
  check_name, 'evaluated', query)
ELSE format('SELECT %L AS check_name, %L AS status, NULL::bigint AS affected_count',
  check_name, 'NOT EVALUATED: required schema absent') END
FROM ready ORDER BY check_name
\gexec
ROLLBACK;
