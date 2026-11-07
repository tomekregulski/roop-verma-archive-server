-- Prepared and synthetic-validated. Existing-data execution needs authorization.
-- An authorized runner must verify the exact b004 hash and private cluster, then
-- populate pg_temp.retirement_targets("userId" integer PRIMARY KEY,
-- "customerId" text NOT NULL) with the six exact pairs privately, in this SAME
-- psql session. Never derive a live target set by count/email or run on Heroku.
\set ON_ERROR_STOP on
\set ECHO none
\pset pager off
SELECT current_database() = 'rvdl_c1_b004'
   AND current_setting('application_name') = 'rvdl-c1-b004-retirement'
   AND inet_server_addr() IS NULL AS approved_target
\gset
\if :approved_target
\else
  \echo 'Refusing unapproved test-account retirement target.'
  SELECT 1 / 0 AS refusing_unapproved_target;
  \quit
\endif

BEGIN;
SET LOCAL search_path = pg_catalog;
SET LOCAL statement_timeout = '5s';
SET LOCAL lock_timeout = '1s';
SET LOCAL client_min_messages = warning;
LOCK TABLE public."User", public."Token", public."TrackPlay",
  public."Subscription", public."WebhookLog", public._prisma_migrations
  IN SHARE ROW EXCLUSIVE MODE;

CREATE TEMP TABLE retirement_protected (
  table_name text NOT NULL, is_unrelated_subset boolean NOT NULL,
  row_count bigint NOT NULL, fingerprint text NOT NULL
) ON COMMIT DROP;
CREATE TEMP TABLE retirement_result (
  deleted_users bigint, deleted_tokens bigint, deleted_test_plays bigint,
  protected_content_unchanged boolean
) ON COMMIT DROP;

DO $retirement$
DECLARE
  name text;
  before_row record;
  rows_now bigint;
  hash_now text;
  token_count bigint;
  play_count bigint;
  removed bigint;
  predicate text;
  fingerprint_query text;
BEGIN
  -- The private runner checks ledger checksums and source/hash identity first.
  IF (SELECT count(*) FROM public._prisma_migrations) <> 24
    OR EXISTS (SELECT 1 FROM public._prisma_migrations
      WHERE finished_at IS NULL OR rolled_back_at IS NOT NULL) THEN
    RAISE EXCEPTION 'Retirement refused: unexpected migration baseline';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
    WHERE n.nspname='public' AND c.relname IN ('LoginProof','IdentitySession',
      'IdentityRateLimit','CheckoutOwnership','BillingCustomer','BillingOperation',
      'PaidInvoiceGrant','StripeEventReceipt')) THEN
    RAISE EXCEPTION 'Retirement refused: modern schema already present';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_constraint c WHERE c.contype='f'
    AND c.confrelid IN ('public."User"'::regclass,'public."Token"'::regclass,
                       'public."TrackPlay"'::regclass)
    AND NOT (c.confrelid='public."User"'::regclass
             AND c.conrelid='public."Subscription"'::regclass)) THEN
    RAISE EXCEPTION 'Retirement refused: unexpected dependent structure';
  END IF;
  IF EXISTS (SELECT 1 FROM public."Subscription")
    OR EXISTS (SELECT 1 FROM public."WebhookLog") THEN
    RAISE EXCEPTION 'Retirement refused: nonempty legacy billing evidence';
  END IF;
  IF (SELECT count(*) FROM pg_temp.retirement_targets) <> 6
    OR (SELECT count(*) FROM public."User") <> 6
    OR EXISTS (SELECT 1 FROM pg_temp.retirement_targets
      WHERE "customerId" IS NULL OR "customerId"='')
    OR EXISTS (SELECT 1 FROM public."User" u
      FULL JOIN pg_temp.retirement_targets t ON t."userId"=u.id
      WHERE u.id IS NULL OR t."userId" IS NULL
        OR u."stripeId" IS DISTINCT FROM t."customerId") THEN
    RAISE EXCEPTION 'Retirement refused: exact six-account target mismatch';
  END IF;

  -- Fingerprints stay transaction-local and are not returned. They are bounded
  -- operational change detectors, not cryptographic erasure/authenticity proof.
  fingerprint_query := 'SELECT count(*), md5(coalesce(string_agg(h, '''' ORDER BY h), '''')) '
    || 'FROM (SELECT md5(row_to_json(r)::text) AS h FROM public.%I r %s) rows';
  FOREACH name IN ARRAY ARRAY['Track','Artist','Category','Event','Location',
    'MediaType','Raga','Tape','TrackArtist','Tribute','NetworkError',
    '_prisma_migrations','Subscription','WebhookLog'] LOOP
    EXECUTE format(fingerprint_query,name,'') INTO rows_now,hash_now;
    INSERT INTO pg_temp.retirement_protected VALUES (name,false,rows_now,hash_now);
  END LOOP;
  FOREACH name IN ARRAY ARRAY['Token','TrackPlay'] LOOP
    predicate := 'WHERE NOT EXISTS (SELECT 1 FROM pg_temp.retirement_targets t '
      || 'WHERE t."userId"=r."userId")';
    EXECUTE format(fingerprint_query,name,predicate) INTO rows_now,hash_now;
    INSERT INTO pg_temp.retirement_protected VALUES (name,true,rows_now,hash_now);
  END LOOP;

  SELECT count(*) INTO token_count FROM public."Token"
    WHERE "userId" IN (SELECT "userId" FROM pg_temp.retirement_targets);
  SELECT count(*) INTO play_count FROM public."TrackPlay"
    WHERE "userId" IN (SELECT "userId" FROM pg_temp.retirement_targets);

  DELETE FROM public."Token"
    WHERE "userId" IN (SELECT "userId" FROM pg_temp.retirement_targets);
  GET DIAGNOSTICS removed = ROW_COUNT;
  IF removed <> token_count THEN RAISE EXCEPTION 'Token count changed; rollback required'; END IF;
  DELETE FROM public."TrackPlay"
    WHERE "userId" IN (SELECT "userId" FROM pg_temp.retirement_targets);
  GET DIAGNOSTICS removed = ROW_COUNT;
  IF removed <> play_count THEN RAISE EXCEPTION 'Test-play count changed; rollback required'; END IF;
  DELETE FROM public."User"
    WHERE id IN (SELECT "userId" FROM pg_temp.retirement_targets);
  GET DIAGNOSTICS removed = ROW_COUNT;
  IF removed <> 6 OR EXISTS (SELECT 1 FROM public."User")
    OR EXISTS (SELECT 1 FROM public."Token" WHERE "userId" IN
      (SELECT "userId" FROM pg_temp.retirement_targets))
    OR EXISTS (SELECT 1 FROM public."TrackPlay" WHERE "userId" IN
      (SELECT "userId" FROM pg_temp.retirement_targets)) THEN
    RAISE EXCEPTION 'Retirement postcondition failed; rollback required';
  END IF;

  FOR before_row IN SELECT * FROM pg_temp.retirement_protected LOOP
    predicate := CASE WHEN before_row.is_unrelated_subset THEN
      'WHERE NOT EXISTS (SELECT 1 FROM pg_temp.retirement_targets t WHERE t."userId"=r."userId")'
      ELSE '' END;
    EXECUTE format(fingerprint_query,before_row.table_name,predicate) INTO rows_now,hash_now;
    IF rows_now <> before_row.row_count OR hash_now IS DISTINCT FROM before_row.fingerprint THEN
      RAISE EXCEPTION 'Protected content changed; rollback required';
    END IF;
  END LOOP;
  INSERT INTO pg_temp.retirement_result VALUES (6,token_count,play_count,true);
END;
$retirement$;

SELECT deleted_users, deleted_tokens, deleted_test_plays, protected_content_unchanged
FROM pg_temp.retirement_result;
COMMIT;
