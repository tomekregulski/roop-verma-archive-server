"""Prepare, but never execute, the reviewed retirement SQL for hosted TEST."""
import argparse
import hashlib
import os
from pathlib import Path

REVIEWED_SHA256 = 'ba799172644bf08a2450f79629ce44c04d0fdb6c24ebbb56232917720669ec38'
HOSTED_HEADER = r'''-- Stage 2 approval, fresh verified backup and writer shutdown are mandatory.
-- The operator verifies the Heroku app/attachment and verified-TLS connection,
-- then supplies the expected database name/OID, exact b004 target pairs and
-- private full-User-row fingerprints in
-- this same psql session. This file contains no credentials or account values.
\set ON_ERROR_STOP on
\set ECHO none
\pset pager off
SELECT current_database() = :'rvdl_expected_database'
   AND (SELECT oid::text FROM pg_database WHERE datname = current_database())
       = :'rvdl_expected_database_oid'
   AND current_setting('application_name') = 'rvdl-hosted-test-retirement'
   AND inet_server_addr() IS NOT NULL AS approved_target
\gset
\if :approved_target
\else
  \echo 'Refusing unapproved hosted TEST retirement target.'
  SELECT 1 / 0 AS refusing_unapproved_target;
  \quit
\endif

'''
LOCK_ANCHOR = '  IN SHARE ROW EXCLUSIVE MODE;'
EMPTY_STORES_GUARD = '''
-- Strengthen the reviewed procedure for the seven-migration target: the global
-- store disposition gate must pass before any targeted identity deletion.
LOCK TABLE public."NetworkError" IN SHARE ROW EXCLUSIVE MODE;
DO $empty_stores$ BEGIN
  IF EXISTS (SELECT 1 FROM public."TrackPlay")
     OR EXISTS (SELECT 1 FROM public."NetworkError") THEN
    RAISE EXCEPTION 'Hosted TEST retirement refused: nonempty removed store';
  END IF;
END $empty_stores$;
-- The b004 fingerprints are private operational change detectors. The original
-- exact-ID/customer-set guard remains the primary deletion boundary below.
DO $unchanged_accounts$ BEGIN
  IF (SELECT count(*) FROM pg_temp.retirement_targets) <> 6
     OR EXISTS (SELECT 1 FROM public."User" u
       FULL JOIN pg_temp.retirement_targets t ON t."userId"=u.id
       WHERE u.id IS NULL OR t."userId" IS NULL
          OR md5(row_to_json(u)::text) IS DISTINCT FROM t."userFingerprint") THEN
    RAISE EXCEPTION 'Hosted TEST retirement refused: reviewed account changed';
  END IF;
END $unchanged_accounts$;
'''


def prepare():
    """Adapt the target preamble and strengthen store/account-change refusal."""
    source = Path(__file__).resolve().parents[1] / 'TEST_ACCOUNT_RETIREMENT.sql'
    original = source.read_bytes()
    if hashlib.sha256(original).hexdigest() != REVIEWED_SHA256:
        raise ValueError('Reviewed retirement SQL changed; stop for review')
    body = original.decode().split('BEGIN;', 1)[1]
    if body.count(LOCK_ANCHOR) != 1:
        raise ValueError('Reviewed lock anchor changed')
    body = body.replace(LOCK_ANCHOR, LOCK_ANCHOR + EMPTY_STORES_GUARD, 1)
    return HOSTED_HEADER + 'BEGIN;' + body


def main():
    """Write an exclusive owner-only SQL artifact without database access."""
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    sql = prepare()
    descriptor = os.open(args.output, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(descriptor, 'w') as output:
        output.write(sql)
    print('Prepared SQL SHA-256:', hashlib.sha256(sql.encode()).hexdigest())


if __name__ == '__main__':
    main()
