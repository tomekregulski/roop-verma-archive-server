-- PREPARED ONLY: catalog flags for the exact pinned transition's named objects.
-- Requires separate rehearsal authorization; no expressions/definitions returned.
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

BEGIN READ ONLY;
SET LOCAL search_path = pg_catalog;
SET LOCAL statement_timeout = '5s';
SET LOCAL lock_timeout = '1s';

-- Compare presence to the current stage: absent before creation and after a
-- containing table is removed, present/validated between those points.
WITH expected(table_name, constraint_name) AS (VALUES
  ('LoginProof', 'LoginProof_userId_fkey'),
  ('IdentitySession', 'IdentitySession_userId_fkey'),
  ('CheckoutOwnership', 'CheckoutOwnership_userId_fkey'),
  ('Subscription', 'Subscription_userId_fkey'),
  ('Subscription', 'Subscription_stripeId_fkey'),
  ('Subscription', 'Subscription_id_nonempty'),
  ('PaidInvoiceGrant', 'PaidInvoiceGrant_period_check'),
  ('PaidInvoiceGrant', 'PaidInvoiceGrant_invalidation_check'),
  ('BillingCustomer', 'BillingCustomer_selected_check'),
  ('BillingCustomer', 'BillingCustomer_access_stamp_check'),
  ('BillingCustomer', 'BillingCustomer_access_cache_check'),
  ('BillingOperation', 'BillingOperation_kind_check'))
SELECT e.table_name, e.constraint_name, c.oid IS NOT NULL AS present,
       c.contype::text AS constraint_type, c.convalidated AS validated
FROM expected e
LEFT JOIN pg_namespace n ON n.nspname = 'public'
LEFT JOIN pg_class t ON t.relnamespace = n.oid AND t.relname = e.table_name
LEFT JOIN pg_constraint c ON c.conrelid = t.oid AND c.conname = e.constraint_name
ORDER BY e.table_name, e.constraint_name;

WITH expected(table_name, index_name) AS (VALUES
  ('LoginProof', 'LoginProof_expiresAt_idx'),
  ('IdentitySession', 'IdentitySession_expiresAt_idx'),
  ('IdentityRateLimit', 'IdentityRateLimit_expiresAt_idx'),
  ('Subscription', 'Subscription_stripeId_status_idx'),
  ('PaidInvoiceGrant', 'PaidInvoiceGrant_subscriptionId_serviceThrough_idx'),
  ('StripeEventReceipt', 'StripeEventReceipt_outcome_receivedAt_idx'),
  ('Subscription', 'Subscription_one_ongoing_accepted'),
  ('BillingCustomer', 'BillingCustomer_selectedSubscriptionId_key'),
  ('BillingOperation', 'BillingOperation_checkout_session_key'))
SELECT e.table_name, e.index_name, i.indexrelid IS NOT NULL AS present,
       i.indisunique AS is_unique, i.indisvalid AS valid, i.indisready AS ready,
       i.indpred IS NOT NULL AS has_predicate
FROM expected e
LEFT JOIN pg_namespace n ON n.nspname = 'public'
LEFT JOIN pg_class t ON t.relnamespace = n.oid AND t.relname = e.table_name
LEFT JOIN pg_class x ON x.relnamespace = n.oid AND x.relname = e.index_name
LEFT JOIN pg_index i ON i.indexrelid = x.oid AND i.indrelid = t.oid
ORDER BY e.table_name, e.index_name;
ROLLBACK;
