# Local C1 migration rehearsal — 2026-11-06

**Outcome: BLOCKED before final C1. The authorized rehearsal is complete.**
The five intermediate migrations succeeded on the disposable b004 copy. Both
trusted-selection guard counts are **6**. Final migration
`20261102120000_c1_billing_consolidation` was **not executed on the backup copy**.
No guard was bypassed, no failed C1 entry was created and no data was repaired,
backfilled, reassigned or erased to make the transition pass.

## Source and isolation

The owner explicitly authorized [C1_MIGRATION_REHEARSAL.md](C1_MIGRATION_REHEARSAL.md).
All 30 migration files, schema, lockfile and four SQL files matched the approved
[manifest](C1_REHEARSAL_MANIFEST.json) before execution and after completion.
Historical migration files and application code remain unchanged.

The Heroku app and canonical application A / DATABASE / Essential-1 mapping were
reverified through provider metadata only. The BROWN shadow resource/database
was reverified distinct; neither remote database was queried or changed.

Only b004, transfer `e4ce90f3-e806-4c89-b179-5745ed9bf3e6`, was retrieved:

| Evidence | Result |
| --- | --- |
| Capture completion | 2026-11-06 11:12:00 UTC / 06:12:00 EST |
| Retrieval | 2026-11-06 12:35:13 UTC / 07:35:13 EST; age 4,993 seconds |
| Download bytes | 52,713 |
| Archive SHA-256 | 16b6a1439bf82e206621d04873146380cb595f193c04e35a8e2d3e79d3759539 |
| Archive review | 17 reviewed base tables; reviewed bundled pg_stat_statements; no unsupported object types |
| Local restore | Succeeded in 0.043 seconds; single transaction, no owner/ACL/tablespace replay |
| Tools | Node 24.19.0, installed Prisma CLI 4.12.0, PostgreSQL/psql/pg_restore 18.4 |
| Target | New owner-only temporary directory, rvdl_c1_b004 database, private Unix socket, no TCP listener |
| Secrets/data handling | Credentials and signed URL only in memory; no individual record values, raw diagnostics or connection URLs displayed/retained |
| Cleanup | Both synthetic clusters and the b004 cluster stopped, PIDs verified exited, all generated dump/data/socket/stage/diagnostic directories removed |

Prisma ran one staged prefix at a time from the private stage directory, with
only the rehearsal datasource variable and no inherited environment or .env.
No shadow URL was configured. Each ledger prefix/checksum, catalog flags and
aggregate invariant was checked before continuing. Inspection used a separate
read-only role and the four approved SQL files, with target guards, read-only
transactions, five-second statement/one-second lock timeouts and ROLLBACK.

No system service or application was started. No live SQL, remote migrations,
provider billing calls, new backups, remote settings, deployment, commit, push
or merge occurred. Findings describe the b004 capture, not current live contents.

## Synthetic validation before backup access

- **Empty historical schema:** all six stages passed, with 30 matching completed
  ledger entries and the expected final object removals.
- **One synthetic historical user:** stages 1–5 passed; both selection guards
  returned 1. The runner stopped before final C1, as required.
- The exact staged CLI commands successfully used Unix-socket mode while TCP
  was disabled. The supplemental facts/catalog SQL executed at every stage.
- Wrong database and application-name guards returned nonzero for all four SQL
  files; the inspection role's attempted write was refused on synthetic data.

These synthetic outcomes validate the command/check/stop behavior; they are
separate from the actual restored-copy evidence below. No synthetic records were
inserted into the b004 copy.

## Restored-copy stages

Baseline: **6 users, all 6 with a non-NULL customer-ID field**, no NULL/empty
customer-ID fields, 24 completed matching historical ledger entries, and zero
Subscription/WebhookLog rows. A stored customer-ID field is not verified Stripe
customer ownership, mode or financial truth.

| Stage | Command result / seconds | Completed matching ledger entries | Users / linked | BillingCustomer / unknown mode / unselected |
| --- | --- | --- | --- | --- |
| Restored baseline | Verified | 24 | 6 / 6 | Absent / NOT EVALUATED / NOT EVALUATED |
| 01 — email identity | Success / 0.371 | 25 | 6 / 6 | Absent / NOT EVALUATED / NOT EVALUATED |
| 02 — billing evidence | Success / 0.353 | 26 | 6 / 6 | 6 / 6 / selection column absent |
| 03 — paid-access cache | Success / 0.346 | 27 | 6 / 6 | 6 / 6 / 6 |
| 04 — owned Checkout | Success / 0.343 | 28 | 6 / 6 | 6 / 6 / 6 |
| 05 — owner-assisted deletion | Success / 0.346 | 29 | 6 / 6 | 6 / 6 / 6 |
| 06 — C1 consolidation | **Not run: guard gate blocked** | 29 | 6 / 6 | 6 / 6 / 6 |

Counts/links stayed constant throughout. Expected constraint/index presence,
type/validation and uniqueness/partial-index flags matched each stage. No
whole-record equality or complete schema-definition equivalence is claimed.
Timings are local command measurements, not production recovery estimates.

Immediately before the withheld C1 migration, all nine guard checks evaluated:

| C1 guard | Count |
| --- | --- |
| CheckoutOwnership rows | 0 |
| Historical Subscription rows | 0 |
| PaidInvoiceGrant rows | 0 |
| StripeEventReceipt rows | 0 |
| WebhookLog rows | 0 |
| Unsupported/orphan immutable attempts | 0 |
| Legacy customer deletion/sync flags | 0 |
| User-to-binding ownership/mode/selection failures | **6** |
| Live-binding-to-user ownership/mode/selection failures | **6** |

The two counts describe the same six associations from opposite directions,
not twelve accounts. They do not establish six ownership mismatches. The measured
NULL mode and NULL selection fields are sufficient to trigger both predicates.
The earlier billing migration created these associations; no later intermediate
migration supplied the missing trust information. No provider lookup was made
to guess it. The original five legacy table rows were all zero at the gate.

## Next decision

The unchanged full migration path is not ready for these six legacy accounts.
Repeating it or weakening the guard will not supply trusted mode/selection.
Do not mark final C1 applied, drop the evidence tables manually or deploy the new
application against the intermediate schema.

Next is a bounded **legacy-account transition policy/design**, using these
aggregate findings. Establish whether and how the six identities/customer links
must be retained, and how accounts without a trusted selected subscription should
transition while failing closed for paid access. Do not infer that the accounts
are disposable tests, that no Stripe subscriptions exist, or that an email match
establishes ownership. Empty local historical mirrors do not answer those questions.

The current scope chooses no retention policy, selection backfill, association
clearing or guard change. Any record/provider investigation or transition
implementation needs its own reviewed scope and authorization. The known
NetworkError nullability policy and PostgreSQL 15 runtime/deployment verification
remain separate. There is no residual local copy to operate on.

Source-only design follow-up:
[LEGACY_ACCOUNT_TRANSITION_DESIGN.md](LEGACY_ACCOUNT_TRANSITION_DESIGN.md) is
prepared. Its per-case recommendation is proposed, not owner-approved, and
introduced no further data/provider access or implementation.
