-- PREPARED ONLY. Stage 2 approval and the owner's fresh normal login are required.
-- Reverify Heroku DATABASE mapping and use verified TLS. Supply the expected
-- database name/OID and the exact newly verified owner account ID privately.
\set ON_ERROR_STOP on
\set ECHO none
\pset pager off
SELECT current_database() = :'rvdl_expected_database'
   AND (SELECT oid::text FROM pg_database WHERE datname=current_database())
       = :'rvdl_expected_database_oid'
   AND current_setting('application_name') = 'rvdl-hosted-test-owner'
   AND inet_server_addr() IS NOT NULL AS approved_target
\gset
\if :approved_target
\else
  SELECT 1 / 0 AS refusing_unapproved_owner_target;
  \quit
\endif

BEGIN;
SET LOCAL search_path = pg_catalog;
SET LOCAL statement_timeout = '5s';
SET LOCAL lock_timeout = '1s';
CREATE TEMP TABLE owner_target (id integer PRIMARY KEY) ON COMMIT DROP;
INSERT INTO owner_target VALUES (:'rvdl_owner_user_id'::integer);
-- Reuse normal account serialization; never hold this lock across provider calls.
DO $owner$
DECLARE target_id integer; changed integer;
BEGIN
  SELECT id INTO STRICT target_id FROM pg_temp.owner_target;
  PERFORM pg_advisory_xact_lock(hashtextextended('purchase:user:' || target_id,0));
  PERFORM id FROM public."User" WHERE id=target_id FOR UPDATE;
  IF (SELECT count(*) FROM public."User"
      WHERE lower(email)='tomek.regulski@gmail.com') <> 1
     OR EXISTS (SELECT 1 FROM public."User" WHERE "isAdmin")
     OR NOT EXISTS (SELECT 1 FROM public."User" u
       WHERE u.id=target_id AND u.email='tomek.regulski@gmail.com'
         AND NOT u."isAdmin" AND u."deletionRequestedAt" IS NULL
         AND EXISTS (SELECT 1 FROM public."IdentitySession" s
           WHERE s."userId"=u.id AND s.email=u.email
             AND s."revokedAt" IS NULL AND s."expiresAt">now())
         AND EXISTS (SELECT 1 FROM public."LoginProof" p
           WHERE p."userId"=u.id AND p.email=u.email AND p.delivered
             AND p."consumedAt">now()-interval '15 minutes'
             AND p."consumedAt"<=now())) THEN
    RAISE EXCEPTION 'Owner provisioning refused: exact fresh verified identity required';
  END IF;
  UPDATE public."User" SET "isAdmin"=true
    WHERE id=target_id AND email='tomek.regulski@gmail.com' AND NOT "isAdmin";
  GET DIAGNOSTICS changed = ROW_COUNT;
  IF changed<>1 THEN RAISE EXCEPTION 'Owner provisioning refused: changed target'; END IF;
END $owner$;
SELECT 1 AS provisioned_owner_count;
COMMIT;
