# Proposed C1 backup inspection — 2026-11-06

Status: the owner authorized and completed this bounded inspection on 2026-11-06.
See [C1_PREFLIGHT_RESULTS.md](C1_PREFLIGHT_RESULTS.md) for actual evidence, query
validation fixes and cleanup. The procedural text below records the reviewed
plan; its original authorization wording is historical. This scope authorized no
migrations, application startup, real billing-provider calls, source-data changes,
selection backfill or retention disposition.

## Reviewed source

Heroku app `roop-verma-archive`, app ID
`fbcc7ce1-7840-40a7-b28b-8a1088c5ac48`. On November 6 the application
`DATABASE_URL` matched canonical database A (`DATABASE`, Essential-1), and the
shadow URL matched a distinct BROWN resource/database. Shadow disposability is
unknown; neither the application database nor BROWN is a restore target.

One owner-authorized manual logical capture, **b004**, transfer UUID
`e4ce90f3-e806-4c89-b179-5745ed9bf3e6`, completed with zero warnings:

| Metadata | Value |
| --- | --- |
| Created | 2026-11-06 11:11:25 UTC / 06:11:25 EST |
| Started | 2026-11-06 11:11:59 UTC / 06:11:59 EST |
| Completed | 2026-11-06 11:12:00 UTC / 06:12:00 EST |
| Original size | 9,725,975 bytes |
| Logical backup size | 52,713 bytes |
| Expiration | Not supplied in returned metadata; no retention guarantee inferred |

These are capture metadata, not restore evidence. Recheck the exact transfer's
availability/status and application mapping immediately before download. If it
is absent, expired or inconsistent, stop; do not capture another backup or
silently substitute a newer/latest backup. This is a point-in-time inspection,
not proof of current source contents or permission to deploy later.

## Protected disposable target

- Use this workstation, a new owner-only directory made with `umask 077` and
  `mktemp -d /private/tmp/rvdl-c1-b004.XXXXXX`; assert its resolved path/owner and
  permissions before any download. Do not use a repository, cloud-synced folder,
  existing test cluster or existing local database. Treat dump, cluster and raw
  diagnostic files as sensitive copies even if there are no real subscribers.
- Create one fresh PostgreSQL cluster under that directory, database
  `rvdl_c1_b004`, private Unix socket inside the same directory, no TCP listener
  (`listen_addresses=''`), socket permissions `0700`. Do not register a service.
  Local socket trust is allowed only inside that verified owner-only directory;
  do not reuse a credential or connection URL from Heroku.
- Local PostgreSQL **18.4** `postgres`/`initdb` binaries were found under
  `/private/tmp/rvdl-billing-postgres-tools/node_modules/@embedded-postgres/darwin-arm64/native/bin`.
  `psql` and `pg_restore` were not found on PATH. The leftover server bundle is
  also incomplete: a synthetic-only initialization attempt failed because its
  `postgres.bki` bootstrap file is missing. Execution first needs a complete,
  compatible PostgreSQL tool bundle, preferably version 18 for this target.
  Recheck existing tools; any required
  tool download/install needs the execution authorization below and normal
  environment approval. Do not install or start a system database service.
- Start no application, frontend, Prisma process, tests against the copy, workers,
  mail, Stripe or media clients. Do not load `.env`, app configuration or production
  secrets into restore/inspection processes. Use a minimal explicit environment;
  discard inherited PGHOST/PGPORT/PGDATABASE/PGSERVICE/PGOPTIONS/PGPASSFILE values.
  All local commands must explicitly select the private socket and database.
- Use separate local restore and inspection roles. The inspection role has only
  CONNECT, public-schema USAGE and SELECT on the reviewed base tables (including
  the ledger), no membership in the restore role, and read-only default sessions.
  Set application_name to `rvdl-c1-b004-preflight`. Every provided SQL file also
  checks database name, application name and Unix-socket connection before reading.
  These checks supplement the verified socket/process path; they alone do not
  identify a database securely.

## Execution sequence requiring separate authorization

1. Verify tools and target isolation before downloading. First validate both SQL
   files on a disposable synthetic cluster, including missing-schema behavior,
   populated blockers, allowed tombstones and a partial schema. Validate psql's
   target refusal and generated-query execution too; a static review alone is
   insufficient. Destroy that synthetic cluster before creating the backup target.
   Acquire b004 through the
   authenticated Heroku backup mechanism with credentials and any signed URL kept
   only in memory. Do not print a URL or put it in argv, shell history, repository,
   command traces or logs. No `curl -v`, raw CLI diagnostics or displayed config.
   Use verified HTTPS, stream only to the private directory with mode `0600`,
   and check the response status, byte count and archive format. A local checksum
   records artifact identity; it does not prove authenticity without a provider
   checksum. Stop on mismatch, interruption or unexpected format.
2. Review the archive table of contents privately with compatible `pg_restore`
   client tools, without displaying raw archive entries or data. Confirm expected
   schemas/tables and required extensions. Stop for review on unexpected executable
   objects, event triggers, foreign servers, subscriptions, scheduler extensions,
   missing dependencies or unsupported versions. Do not execute unfamiliar dump
   SQL or install extensions automatically.
3. Restore only into the new empty local database. Use explicit socket/database,
   `--no-owner --no-privileges --no-tablespaces --exit-on-error --single-transaction`.
   Do not use `--clean`, a remote URL, production roles or the migration shadow.
   Verify these flags with the selected client's help before execution. Keep
   diagnostics private; report only sanitized status, since error context can
   contain row values. Any restore error stops the inspection; no partial-success
   claim, automatic data repair, migration or blind retry.
4. Grant the local inspection role its narrow read permissions, then run
   [C1_PREFLIGHT_SCHEMA.sql](C1_PREFLIGHT_SCHEMA.sql) using `psql -X` and explicit
   socket/role/database. Review types/nullability and the migration ledger before
   running data SQL. Compare ledger names/checksums to the exact current local
   historical migration bytes. Stop on missing/unexpected ledger, unfinished or
   rolled-back entries, checksum mismatch, unexpected types/schema or any error.
   Report schema gaps; never replay missing migrations to make queries work.
   A PostgreSQL 18 restore is not a PostgreSQL 15 runtime/deployment rehearsal.
5. Only after that review, run [C1_PREFLIGHT_DATA.sql](C1_PREFLIGHT_DATA.sql) in a
   read-only repeatable-read transaction with five-second statement and one-second
   lock timeouts, ending in ROLLBACK. Missing required base tables or columns
   produce **NOT EVALUATED**, not zero. Stop on timeout or errors. Do not broaden
   queries to individual records or retry with larger limits automatically.
6. Retain only the sanitized report described below. Stop the exact temporary
   server, verify it exited, and delete only the verified directory created for
   this run, including dump, restored data, sockets and diagnostics, before ending
   the session. The proposed authorization includes this scoped cleanup; it does
   not delete b004 on Heroku or change provider backup retention. If cleanup fails,
   report the protected location and required action without exposing contents.
   Filesystem removal is not a guarantee of physical erasure or exclusion from
   workstation snapshots; do not claim such a guarantee.

## Exact inspection and interpretation

The SQL returns reviewed schema metadata, selected ledger fields with a log-text
presence boolean, and aggregate counts. No emails/names, customer/session/token
values, billing IDs, immutable request JSON, webhook bodies, media URLs, migration
log text or individual listening records are returned.

| Checks | Meaning/action |
| --- | --- |
| Each of CheckoutOwnership, Subscription, PaidInvoiceGrant, StripeEventReceipt, WebhookLog | Any rows block C1. Checkout closure investigation and explicit owner retention/disposition are required; even applied/ignored records are blockers. |
| Unsupported/orphan BillingOperation predicate | Matches C1's kind/version/live-owner guard. Investigate; do not rewrite immutable parameters, assign owners or delete evidence. |
| Legacy customer deletion/sync flags | Matches C1 guard. Any unresolved evidence needs separate investigation. |
| User-to-binding and live-binding-to-user predicates | Match C1's exact ownership/mode/selection-null checks. A structurally populated selection does not establish trusted provenance or provider truth. |
| Earlier billing migration subscription ownership predicate | Checks that earlier migration's exact refusal condition, independently from C1. It does not authorize that migration. |
| Normalized email collision groups and blank/null emails | Aggregate identity-review signals only; no automatic merge, ownership inference or relinking. |
| Customer/attempt tombstones and pending account-deletion requests | Preservation counts, not records to remove or independent permission to complete deletion. |
| Live associations and live attempts | Any such rows require a separately scoped provenance/immutable-attempt review. This aggregate-only pass does not validate digests, request shapes, exact Checkout closure, selected subscription provenance or Stripe mode/tier configuration. |

Absent modern tables are expected to be possible: October 25 metadata recorded
the pre-identity schema. That dated evidence is not assumed true for b004. The
earlier billing migration creates unselected associations from existing users;
the later cache migration does not backfill selection. Therefore missing billing
tables plus existing linked users cannot be interpreted as a C1 pass. Resolve
the schema/transition design separately; do not apply migrations to discover it.

The final report records backup identity/time/age, restore status/duration,
target/client versions, schema/ledger comparison, each aggregate result or
NOT EVALUATED, and required owner decisions. All C1 guard counts must be zero
on the required schema to establish structural compatibility. Even then,
provenance and provider verification remain separate. Report **blocked** or
**incomplete** where applicable; never infer migration or launch approval.

## Proposed authorization text

> I authorize downloading only Heroku backup b004 for roop-verma-archive after
> reverifying its identity and availability, obtaining complete compatible local
> PostgreSQL tools if needed without starting a system service, validating the
> prepared SQL on synthetic data first, restoring the backup into the
> fresh protected local target specified in C1_DATA_PREFLIGHT.md, and running only
> C1_PREFLIGHT_SCHEMA.sql and, after schema review, C1_PREFLIGHT_DATA.sql. Keep
> credentials, signed URLs, raw diagnostics and record values private. Retain only
> sanitized findings; stop and remove the temporary cluster and dump afterward.
> No live database queries, additional backup capture, migrations, application
> startup, provider calls beyond backup retrieval/metadata, settings changes,
> retention disposition, deployment, commit, push or merge.

The owner subsequently approved this scope in chat on 2026-11-06. It is fulfilled;
the results do not authorize future downloads, migrations or deployments.

## Preparation validation

The predicates were reviewed against the exact C1 guard and the earlier billing
migration. Static checks validate the fixed query specifications and dependency
declarations. SQL execution on PostgreSQL/psql is **not yet verified**: the local
synthetic initialization attempt stopped on the missing bootstrap file before
any SQL ran. Its temporary directory was removed. No backup was downloaded,
restored or queried, and no application was started during preparation.

Execution update: complete PostgreSQL 18.4 tools were obtained, both SQL files
were runtime-validated on synthetic data, and b004 was restored/inspected locally.
The private copy and synthetic clusters were removed. The reviewed bundled
pg_stat_statements dependency needed no preload/configuration change. Full
results and the remaining C1 schema/transition gap are in the linked results file.
