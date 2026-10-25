-- PROPOSED ONLY: requires explicit owner authorization and a verified target.
-- No application records, migration log bodies, credentials or URLs are selected.
-- Connect externally with a read-only session; never import the app or run Prisma.
-- Run section A first. Run B separately ONLY if A confirms the ledger exists.

-- A: PostgreSQL version, ledger location, columns, indexes and constraints.
BEGIN READ ONLY;
SET LOCAL statement_timeout = '5s';
SET LOCAL lock_timeout = '1s';
SELECT current_setting('server_version') AS server_version,
       current_setting('transaction_read_only') AS transaction_read_only;
SELECT n.nspname AS schema_name, c.relname AS ledger_name
FROM pg_catalog.pg_class c
JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
WHERE c.relname = '_prisma_migrations' AND c.relkind IN ('r', 'p');
SELECT table_schema, table_name, column_name, ordinal_position,
       data_type, udt_name, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
ORDER BY table_name, ordinal_position;
SELECT schemaname, tablename, indexname, indexdef
FROM pg_catalog.pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;
SELECT n.nspname AS schema_name, t.relname AS table_name,
       c.conname AS constraint_name, c.contype AS constraint_type,
       c.convalidated AS validated, pg_get_constraintdef(c.oid) AS definition
FROM pg_catalog.pg_constraint c
JOIN pg_catalog.pg_class t ON t.oid = c.conrelid
JOIN pg_catalog.pg_namespace n ON n.oid = t.relnamespace
WHERE n.nspname = 'public'
ORDER BY t.relname, c.conname;
ROLLBACK;

-- B: only after A confirms public._prisma_migrations and expected columns.
-- If another schema is found, stop and obtain review of a qualified revision.
BEGIN READ ONLY;
SET LOCAL statement_timeout = '5s';
SET LOCAL lock_timeout = '1s';
SELECT migration_name, checksum, started_at, finished_at,
       rolled_back_at, applied_steps_count,
       (logs IS NOT NULL AND logs <> '') AS has_log_text
FROM public._prisma_migrations
ORDER BY started_at, migration_name;
ROLLBACK;
