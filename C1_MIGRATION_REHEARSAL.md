# Prepared local transition rehearsal — 2026-11-06

**Execution completed under explicit owner authorization on 2026-11-06.** The
rehearsal stopped before final C1: both selection guards counted six associations.
See [C1_REHEARSAL_RESULTS.md](C1_REHEARSAL_RESULTS.md). All temporary copies were
removed. The procedure and original proposed authorization below record the
approved scope; they do not authorize another run. During the preceding
preparation no backup/database was accessed. Working-tree changes are preserved.

## Decision this rehearsal resolves

The [b004 preflight](C1_PREFLIGHT_RESULTS.md) verified a usable local restore,
24 matching historical migrations and empty Subscription/WebhookLog tables. It
did not count users. Six migrations remain between that schema and C1.

Source establishes a concrete conditional blocker: if any historical users
exist and the billing-evidence migration succeeds, it inserts a BillingCustomer
for **every user**, with livemode NULL. The cache migration adds a NULL selection;
none of the remaining intermediate migrations supplies either value. C1 rejects
these live associations. An empty or NULL customer ID can instead make the
earlier insert fail. Empty historical subscriptions therefore do not prove this
transition works. No email/status-based selection backfill is approved.

The existing consolidation test replays intermediate migrations on an empty
schema, then constructs accounts with an explicit known mode/selection before
C1. Its happy path does not establish compatibility with historical users that
exist before the association INSERT. Keep that test evidence distinct.

## Scope and target

Use only the exact **b004**, transfer
`e4ce90f3-e806-4c89-b179-5745ed9bf3e6`, from application A on
`roop-verma-archive`. Reverify mapping, availability, successful capture, 52,713
bytes and SHA-256
`16b6a1439bf82e206621d04873146380cb595f193c04e35a8e2d3e79d3759539`.
Stop if unavailable or changed; no replacement/latest backup or fresh capture.

Reuse the isolation, private retrieval, archive review and cleanup requirements
in [C1_DATA_PREFLIGHT.md](C1_DATA_PREFLIGHT.md), with a **new** owner-only directory
under `/private/tmp/rvdl-c1-rehearsal.XXXXXX`, not a retained earlier cluster.
Database name remains `rvdl_c1_b004` so the validated SQL target guards can be
reused. Only the newly verified Unix socket may be used; no TCP listener.
PostgreSQL/psql/pg_restore 18.4 are installed; bundled pg_stat_statements was
reviewed and tested previously. Recheck availability before download. No system
service, preload change, extension statistics query or external provider client.

Use the separate local restore/migration role and read-only inspection role.
The inspection role has SELECT only on the reviewed tables. Regrant SELECT for
new tables after each stage; do not grant CREATE, restore-role membership or a
broad schema/table privilege. Run no app, test suite or generated application
client against the copy. Display no record values, connection strings, raw SQL
errors, migration log text or backup URLs. Inspect failed diagnostics privately
only to classify the error without retaining sensitive values.

## Pinned files and migration commands

[C1_REHEARSAL_MANIFEST.json](C1_REHEARSAL_MANIFEST.json) pins all 30 local migration
files, the source schema, migration lockfile and four inspection SQL files.
Before execution compare every source byte to that manifest. Stop on any drift;
do not edit historical migrations or silently regenerate the approval snapshot.
Use the installed Prisma 4.12.0 CLI and a compatible Node 24 runtime. A candidate
Node binary exists at
`/private/tmp/rvdl-ci-tools/node_modules/node24/bin/node`; its presence/version and
the CLI/native engine must be rechecked and tested on synthetic data first.
No implicit npx download, npm install, engine download or app dependency change.

Create six staged Prisma directories **inside the private rehearsal directory**.
For each stage copy the 24 historical migrations plus only that stage's new
prefix, preserving each migration.sql and migration_lock.toml byte for byte.
Do not put all six pending migrations in the first stage's directory. Copy the
full current schema for CLI parsing, replacing only its datasource block in the
temporary copy with:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("C1_REHEARSAL_DATABASE_URL")
}
```

No shadow datasource is used by migrate deploy. Do not set DATABASE_URL or
HEROKU_POSTGRESQL_BROWN_URL. Do not run migrate dev, reset, db push, migrate
resolve or execute migration files with psql. Prisma must maintain its own
ledger. Stage names and the exact deploy order are:

| Stage | Newly available migration | Expected completed ledger total |
| --- | --- | --- |
| 01-identity | 20261017160000_email_identity | 25 |
| 02-evidence | 20261101120000_billing_evidence | 26 |
| 03-cache | 20261101180000_paid_access_cache | 27 |
| 04-checkout | 20261101200000_owned_checkout | 28 |
| 05-deletion | 20261102000000_owner_assisted_deletion | 29 |
| 06-c1 | 20261102120000_c1_billing_consolidation | 30, only if pre-C1 gates pass |

Run each command independently using subprocess arguments, not a shell loop or
a chained series of deploys. For a verified `private_root`, a fixed `stage` from
the table and verified absolute `node24`/`prisma_cli` paths, the command contract is:

```python
subprocess.run(
    [node24, prisma_cli, "migrate", "deploy", "--schema",
     str(private_root / "stages" / stage / "schema.prisma")],
    cwd=str(private_root / "stages" / stage),
    env={
        "PATH": "/usr/bin:/bin",
        "TMPDIR": str(private_root),
        "PRISMA_HIDE_UPDATE_MESSAGE": "1",
        "C1_REHEARSAL_DATABASE_URL": local_socket_url,
    },
    capture_output=True, text=True, timeout=60,
)
```

The migration URL is built privately as
`postgresql://rvdl_restore@localhost/rvdl_c1_b004` with query parameters `host`
(the verified private socket directory, percent-encoded), `schema=public`,
`connection_limit=1` and `connect_timeout=5`. The localhost authority is a URL
placeholder for Unix-socket mode, not permission to use TCP. Verify actual Unix
socket behavior with this exact CLI/URL on synthetic data before retrieving b004.
Stop if it falls back to TCP or cannot connect; do not open a listener to adapt.
Apply local migration-role defaults of 15-second statement and one-second lock
timeouts. Do not inherit process environment, .env files or production URLs.
Run from the private stage directory, which contains no .env or app package.
Keep CLI output private; retain stage/result/duration and sanitized error class.

Before **every** deploy, recheck the target's socket directory ownership/mode,
postmaster PID/data-directory identity, absence of TCP listeners, database name,
current role and current 24+stage-prefix ledger/checksums. Pin the one expected
new migration and staged directory hashes. Do not treat CLI exit code alone as
evidence of the expected ledger or schema result.

## Inspection command and files

For each inspection use psql arguments equivalent to:

```text
/opt/homebrew/opt/postgresql@18/bin/psql -X -q -A -t -F '\t'
  -v ON_ERROR_STOP=1 -h VERIFIED_PRIVATE_SOCKET -U rvdl_inspect
  -d rvdl_c1_b004 -f REVIEWED_SQL_FILE
```

Pass a literal tab as the field-separator argument, not a two-character escape.
Use only explicit PATH/LANG/TMPDIR plus PGAPPNAME=`rvdl-c1-b004-preflight` and
PGOPTIONS=`-c default_transaction_read_only=on`; do not inherit PG* settings.
Schema/ledger output is metadata-only; aggregate output contains fixed labels,
counts and presence flags. Each file enforces the local database/app marker,
Unix socket, read-only transaction, timeouts and ROLLBACK.

- [C1_PREFLIGHT_SCHEMA.sql](C1_PREFLIGHT_SCHEMA.sql): schema/ledger after restore
  and after every successful stage. Recheck checksums and the expected prefix.
- [C1_PREFLIGHT_DATA.sql](C1_PREFLIGHT_DATA.sql): baseline, after stage 01,
  stage 02, stage 03, stage 04 and stage 05. Dependency-sensitive checks remain
  NOT EVALUATED until their columns exist. Regrant narrow SELECT first.
- [C1_REHEARSAL_FACTS.sql](C1_REHEARSAL_FACTS.sql): new supplemental aggregates
  at baseline and after every successful stage, including final C1. Counts users,
  non-NULL/NULL/empty customer IDs, intermediate associations and missing mode/
  selection. Also lists catalog presence for the exact C1-removed objects. It
  returns no customer IDs, emails or request values. It has been statically
  reviewed, not executed; validate on synthetic fixtures before backup access.

The following stage checks are mandatory, not optional progress observations:

| Point | Required observation / stop condition |
| --- | --- |
| Restored baseline | Same 24 matching historical entries, expected pre-identity schema, zero Subscription/WebhookLog and earlier ownership failures. Record user totals U and linked totals L. Historical schema makes L=U. Any empty/NULL customer ID or unexpected schema/ledger: stop before migration. |
| After 01 | Exactly one new finished identity entry and four new empty identity/ownership tables. User/linked totals unchanged. Stop on any unexpected rows or ledger/schema result. |
| After 02 | BillingCustomer total U, unknown-mode total U; zero new operations/grants/receipts and unchanged empty Subscription. User/linked totals unchanged. selectedSubscriptionId is absent at this stage, so its checks are NOT EVALUATED. Any departure: stop. |
| After 03 | SelectedSubscriptionId now exists; unselected total U and unknown-mode total U. Cache/selection constraints exist as specified by the unchanged migration. No value is filled by the rehearsal. |
| After 04 | User.stripeId becomes nullable; totals and actual links unchanged. User.deletionRequestedAt and the owned Checkout uniqueness index exist. D9 attempt-column checks may remain NOT EVALUATED. |
| After 05 | D9 user revision/notice and attempt tombstone/closure columns exist. All **nine C1 guard checks** now evaluate. Preserve all user and binding counts. |
| Before 06 | All nine guard counts must be exactly zero, none NOT EVALUATED. Nonzero guards produce a BLOCKED result, then cleanup; **do not execute stage 06 to reproduce an already-established failure**. No provider calls, backfill, deletion, reassignment, guard edits or ledger overrides. |
| After 06, if eligible | Ledger exactly 30 complete matching entries; all five removed tables and seven removed columns absent. User/binding totals and the retained schema must match the expected source changes. Do not rerun row-count queries on dropped tables. Inspect with schema SQL and supplemental facts instead. |

If U>0 and stages 01–05 succeed, source predicts both selection/ownership guard
counts will be U. This is an expected blocker, not permission to manufacture
mode/selection values or discard accounts. If U=0, the unchanged path may pass;
execution still must verify every condition. No new users or synthetic records
are inserted into the restored copy to change either outcome.

Constraint/index verification in the stage table requires a narrowly scoped
catalog check before execution: use the schema SQL column inventory plus
catalog presence/type/validation flags for the exact names in the pinned SQL.
Do not print raw definitions/default expressions. This is prepared explicitly in
[C1_REHEARSAL_CONSTRAINTS.sql](C1_REHEARSAL_CONSTRAINTS.sql).

## Failure and cleanup

Stop immediately on unavailable tools/backup, identity/hash drift, restore or
query errors, timeout, unexpected records/schema, incomplete/failed ledger or a
nonzero final guard. Never rerun a failed migration on the same existing-data
copy. Migrations 01 and 05 lack a surrounding explicit BEGIN/COMMIT, so do not
assume a whole-file rollback on failure. Record only the safe stage/error class,
stop the local server, verify its PID exited and remove the entire generated
directory including dump, stage copies, database and diagnostics. No manual
ledger repair or attempts to salvage/retain the copy. Cleanup runs on success,
failure and interruption; surface any cleanup failure before ending the session.

Report stage durations/results, aggregate U/L and guard results, pending/applied
prefix and exact hashes, final object-presence checks or the stop stage, and
cleanup confirmation. Counts do not establish record-byte equality, financial
truth, provider readiness or PostgreSQL 15 deployment compatibility. Retain only
sanitized findings. Do not change Heroku backup retention or delete b004.

## Separate execution authorization

The earlier b004 inspection authorization is fulfilled and does not authorize
this new retrieval or migrations. The following is the complete proposed scope:

> I authorize the local rehearsal in C1_MIGRATION_REHEARSAL.md: validate the exact
> staged Prisma commands and additional SQL on synthetic data first; reverify,
> retrieve only b004 and restore it into a new protected local cluster; execute
> the pinned migrations one stage at a time only on that copy, stopping before
> final C1 unless every guard passes; run the listed schema, aggregate and catalog
> checks; then stop and remove every generated cluster, dump and diagnostic file.
> Preserve records except for changes made by the exact approved migrations.
> No live SQL, new backup, selection backfill, retention/ownership disposition,
> application startup, real billing-provider calls, remote settings, deployment,
> commit, push or merge.

No account-policy input is needed to prepare or run a stop-on-blocker rehearsal.
If the backup has users and triggers the predicted selection blocker, deciding
how to transition those accounts is separate owner/engineering work. This plan
does not preselect that policy or authorize its implementation.
