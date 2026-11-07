-- PREPARED ONLY: extra aggregate access requires the rehearsal authorization.
-- Reuse the verified copy's database/app marker, on a NEW private socket cluster.
\set ON_ERROR_STOP on
\set ECHO none
\pset pager off
SELECT current_database() = 'rvdl_c1_b004'
   AND current_setting('application_name') = 'rvdl-c1-b004-preflight'
   AND inet_server_addr() IS NULL AS approved_target
\gset
\if :approved_target
\else
  \echo 'Refusing unapproved rehearsal target.'
  SELECT 1 / 0 AS refusing_unapproved_target;
  \quit
\endif

BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY;
SET LOCAL search_path = pg_catalog;
SET LOCAL statement_timeout = '5s';
SET LOCAL lock_timeout = '1s';

-- The reviewed historical User schema is mandatory before running this file.
-- These counts close the earlier aggregate pass's existing-user evidence gap.
SELECT 'user_rows' AS fact, count(*) AS affected_count FROM public."User"
UNION ALL
SELECT 'user_linked_rows', count(*) FROM public."User" WHERE "stripeId" IS NOT NULL
UNION ALL
SELECT 'user_null_customer_id_rows', count(*) FROM public."User" WHERE "stripeId" IS NULL
UNION ALL
SELECT 'user_empty_customer_id_rows', count(*) FROM public."User" WHERE "stripeId" = '';

-- A missing intermediate table/column remains NOT EVALUATED, never zero.
WITH checks(fact, required, query) AS (VALUES
 ('billing_customer_rows', '{"BillingCustomer":[]}'::jsonb,
  'SELECT count(*) FROM public."BillingCustomer"'),
 ('billing_customer_unknown_mode_rows', '{"BillingCustomer":["livemode"]}'::jsonb,
  'SELECT count(*) FROM public."BillingCustomer" WHERE livemode IS NULL'),
 ('billing_customer_unselected_rows', '{"BillingCustomer":["selectedSubscriptionId"]}'::jsonb,
  'SELECT count(*) FROM public."BillingCustomer" WHERE "selectedSubscriptionId" IS NULL')
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
  'SELECT %L AS fact, %L AS status, (%s)::bigint AS affected_count',
  fact, 'evaluated', query)
ELSE format('SELECT %L AS fact, %L AS status, NULL::bigint AS affected_count',
  fact, 'NOT EVALUATED: required schema absent') END
FROM ready ORDER BY fact
\gexec

-- Read catalog presence directly after C1; removed tables are not counted then.
WITH expected(table_name) AS (VALUES ('CheckoutOwnership'), ('Subscription'),
  ('PaidInvoiceGrant'), ('StripeEventReceipt'), ('WebhookLog'))
SELECT 'removed_table' AS object_kind, e.table_name AS object_name,
       EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
         WHERE n.nspname = 'public' AND c.relname = e.table_name) AS still_present
FROM expected e ORDER BY e.table_name;

WITH expected(table_name, column_name) AS (VALUES
  ('User', 'subscriptionActive'), ('BillingCustomer', 'revision'),
  ('BillingCustomer', 'deletionRequestedAt'), ('BillingCustomer', 'lastSyncedAt'),
  ('BillingCustomer', 'syncIssueCode'), ('BillingCustomer', 'reconcileCursor'),
  ('BillingCustomer', 'lastFullScanAt'))
SELECT 'removed_column' AS object_kind,
       e.table_name || '.' || e.column_name AS object_name,
       EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
         JOIN pg_attribute a ON a.attrelid = c.oid
         WHERE n.nspname = 'public' AND c.relname = e.table_name
           AND a.attname = e.column_name AND a.attnum > 0 AND NOT a.attisdropped) AS still_present
FROM expected e ORDER BY e.table_name, e.column_name;
ROLLBACK;
