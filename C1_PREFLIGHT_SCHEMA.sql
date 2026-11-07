-- PROPOSED ONLY. Run with psql -X against the separately authorized local copy.
-- No migration, customer values, raw definitions or migration log bodies.
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

BEGIN READ ONLY;
SET LOCAL search_path = pg_catalog;
SET LOCAL statement_timeout = '5s';
SET LOCAL lock_timeout = '1s';
SELECT current_setting('server_version') AS restored_server_version,
       current_setting('transaction_read_only') AS transaction_read_only;

-- An absent relation is a schema gap, never evidence of zero records.
WITH expected(table_name) AS (VALUES
  ('_prisma_migrations'), ('User'), ('Subscription'), ('WebhookLog'),
  ('CheckoutOwnership'), ('BillingCustomer'), ('BillingOperation'),
  ('PaidInvoiceGrant'), ('StripeEventReceipt'), ('LoginProof'),
  ('IdentitySession'), ('IdentityRateLimit'), ('NetworkError')
)
SELECT e.table_name, c.relkind::text AS relation_kind,
       CASE WHEN c.relkind IN ('r', 'p') THEN 'base table present'
            WHEN c.oid IS NULL THEN 'absent; not evaluated'
            ELSE 'unexpected relation kind; stop' END AS status
FROM expected e
LEFT JOIN pg_namespace n ON n.nspname = 'public'
LEFT JOIN pg_class c ON c.relnamespace = n.oid AND c.relname = e.table_name
ORDER BY e.table_name;

-- Types/nullability only: defaults, routine bodies and index expressions may
-- contain literals and are deliberately excluded from the displayed report.
SELECT c.relname AS table_name, a.attname AS column_name,
       format_type(a.atttypid, a.atttypmod) AS column_type,
       a.attnotnull AS not_null
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
JOIN pg_attribute a ON a.attrelid = c.oid
WHERE n.nspname = 'public' AND c.relkind IN ('r', 'p')
  AND c.relname IN ('_prisma_migrations', 'User', 'Subscription', 'WebhookLog',
    'CheckoutOwnership', 'BillingCustomer', 'BillingOperation', 'PaidInvoiceGrant',
    'StripeEventReceipt', 'LoginProof', 'IdentitySession', 'IdentityRateLimit',
    'NetworkError')
  AND a.attnum > 0 AND NOT a.attisdropped
ORDER BY c.relname, a.attnum;

-- Do not query ledger fields unless the expected columns exist on a base table.
WITH ledger AS (
  SELECT c.oid FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public' AND c.relname = '_prisma_migrations'
    AND c.relkind IN ('r', 'p')
), required(name) AS (VALUES ('migration_name'), ('checksum'), ('started_at'),
  ('finished_at'), ('rolled_back_at'), ('applied_steps_count'), ('logs'))
SELECT CASE WHEN EXISTS (SELECT 1 FROM ledger)
  AND NOT EXISTS (SELECT 1 FROM required r WHERE NOT EXISTS (
    SELECT 1 FROM ledger l JOIN pg_attribute a ON a.attrelid = l.oid
    WHERE a.attname = r.name AND a.attnum > 0 AND NOT a.attisdropped))
THEN $query$
  SELECT migration_name, checksum, started_at, finished_at, rolled_back_at,
         applied_steps_count, (logs IS NOT NULL AND logs <> '') AS has_log_text
  FROM public._prisma_migrations ORDER BY started_at, migration_name
$query$
ELSE $query$ SELECT 'migration ledger absent or incomplete; stop for review' AS status $query$
END
\gexec
ROLLBACK;
