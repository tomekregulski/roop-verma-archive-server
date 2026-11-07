# C1 existing-data preflight — b004, 2026-11-06

**Backup restore verified locally; C1 transition readiness remains incomplete.**
The owner authorized tools, synthetic validation, b004-only retrieval, an isolated
local restore, the reviewed schema/aggregate SQL and cleanup. No live SQL,
migrations, application startup, deployment, new backup capture, remote settings,
commit, push or merge occurred. No retention disposition or selection backfill
was chosen. Findings describe the backup's capture time, not current live data.

## Source and restore evidence

| Item | Observed result |
| --- | --- |
| Heroku app | roop-verma-archive |
| Application database | Reverified canonical A / DATABASE / Essential-1 |
| Shadow | Reverified distinct BROWN resource/database; not queried or used as target |
| Backup | b004 / transfer e4ce90f3-e806-4c89-b179-5745ed9bf3e6 |
| Capture completed | 2026-11-06 11:12:00 UTC / 06:12:00 EST; zero provider warnings |
| Final retrieval | 2026-11-06 12:12:58 UTC / 07:12:58 EST; backup age 3,659 seconds |
| Size | 52,713 archive bytes; 9,725,975 original database bytes |
| Format | PostgreSQL custom archive |
| Archive SHA-256 | 16b6a1439bf82e206621d04873146380cb595f193c04e35a8e2d3e79d3759539 |
| Source / dump version | PostgreSQL 15.18 / pg_dump 15.19, from archive metadata |
| Target / restore client | PostgreSQL 18.4 / pg_restore 18.4 (Homebrew) |
| Restore | Successful, single transaction, no owner/ACL/tablespace replay; measured restore command 0.044 seconds |
| Isolation | New owner-only /private/tmp directory; private Unix socket; no TCP listener; separate read-only inspection role |
| Expiration | Not supplied in provider metadata; no retention guarantee inferred |
| Cleanup | Every generated synthetic/backup cluster stopped and removed; downloaded dumps, sockets and private diagnostics removed |

The checksum identifies the downloaded artifact; no independent provider checksum
was available. A small local PostgreSQL 18 restore does not establish PostgreSQL
15 runtime compatibility, production recovery duration or a launch-ready rollout.
Complete PostgreSQL 18.4 tools were installed; no system service was started.

The archive contained 17 reviewed public base tables and one extension,
`pg_stat_statements`. The initial allowlist stopped before restore on that
extension. Its bundled local control/SQL definitions were then reviewed and its
creation tested on synthetic data before explicitly permitting it in the isolated
restore. No additional extension package, preload configuration, statement
collection or statistics query was enabled. There were no remaining unsupported
archive object types. No extension statistics, record values or raw definitions
were displayed or retained.

## SQL validation and execution

Synthetic PostgreSQL/psql checks passed for all 17 aggregate query specifications:
wrong-database and wrong-application-name refusal, missing tables, missing columns,
populated blockers, permitted attempt tombstones, normalized-email diagnostics,
inspection-role write refusal and generated SELECT execution. A synthetic ledger
also validated the report parser and checksum comparison.

Validation corrected the target guard in both SQL files: `psql` ignores an exit
code argument to `\quit`, so the refusal branch now raises a constant SQL error
under ON_ERROR_STOP. This adds no record access. The corrected queries were
validated before accessing the backup. A seven-field ledger report-parser issue
was likewise corrected and tested synthetically before the final inspection.

| Executed file | SHA-256 |
| --- | --- |
| C1_PREFLIGHT_SCHEMA.sql | 3020b7d2cb37a30a27804fd48ef7102f78c9d7c795e1c6a62fa38a16f4284cf6 |
| C1_PREFLIGHT_DATA.sql | d0f10b4404dacdf5571067939baa92b36f787bdc191f524bf11766a96769a429 |

Only these files queried the restored copy. Sessions used the private socket and
explicit local database/role; read-only transactions used five-second statement
and one-second lock timeouts and ended in ROLLBACK. No application or Prisma
process was imported or started. Local administrative commands only initialized
the disposable target and granted the inspection role reviewed SELECT access.

## Schema and ledger

All **24 historical migrations** through `20250208160454_network` are complete,
match the exact local migration-file SHA-256 checksums and form the complete
historical prefix. No unfinished/rolled-back entries or nonempty log bodies were
indicated; log text was not selected.

These six local migrations are absent from the backup ledger:

1. `20261017160000_email_identity`
2. `20261101120000_billing_evidence`
3. `20261101180000_paid_access_cache`
4. `20261101200000_owned_checkout`
5. `20261102000000_owner_assisted_deletion`
6. `20261102120000_c1_billing_consolidation`

User, Subscription, WebhookLog and the public ledger have the reviewed historical
column types/nullability. LoginProof, IdentitySession, IdentityRateLimit,
CheckoutOwnership, BillingCustomer, BillingOperation, PaidInvoiceGrant and
StripeEventReceipt are absent. These expected schema gaps were reviewed before
the aggregate SQL ran; no migrations were applied to make checks evaluable.

The known separate telemetry drift remains: NetworkError.errorCode is INTEGER
NOT NULL while current Prisma permits null. NetworkError.timestamp is NOT NULL.
This inspection does not claim complete schema/index/constraint equivalence.

## Exact aggregate results

Five checks were evaluated; all returned zero. Twelve were **NOT EVALUATED**
because their required schema is absent; they are not passes or empty-table claims.

| Query check | Count/result |
| --- | --- |
| c1_checkout_ownership_rows | NOT EVALUATED |
| c1_event_receipt_rows | NOT EVALUATED |
| c1_legacy_customer_flags | NOT EVALUATED |
| c1_live_customer_ownership_selection_failures | NOT EVALUATED |
| c1_paid_invoice_grant_rows | NOT EVALUATED |
| c1_subscription_rows | **0** |
| c1_unsupported_or_orphan_attempts | NOT EVALUATED |
| c1_user_binding_selection_failures | NOT EVALUATED |
| c1_webhook_log_rows | **0** |
| diagnostic_blank_or_null_emails | **0** |
| diagnostic_normalized_email_duplicate_groups | **0** |
| earlier_billing_migration_subscription_ownership_failures | **0** |
| preserve_customer_tombstones | NOT EVALUATED |
| preserve_deleted_attempt_tombstones | NOT EVALUATED |
| preserve_pending_account_deletion_requests | NOT EVALUATED |
| review_live_associations | NOT EVALUATED |
| review_live_owned_attempts | NOT EVALUATED |

The earlier subscription-ownership result is vacuous because Subscription is
empty. Zero email diagnostics do not prove mailbox ownership or absence of users.
The reviewed SQL did not count users/linked users or inspect individual accounts;
existing association and trusted-selection disposition remains unknown. There
were no record-level lookups or real Stripe calls.

## Required next work

Prepare a bounded **local transition rehearsal** for the full six-migration path
from this historical schema. Review how the intermediate billing migration's
association INSERT and lack of trusted selection interact with C1's final guard;
do not infer a pass from empty historical subscriptions or absent modern tables.
Do not guess by email, backfill selection, erase evidence or skip guards. Keep
the known telemetry policy decision separate.

Executing that rehearsal requires separate authorization to retrieve/restore
b004 again and run the exact reviewed migration set **only on another disposable
local copy**, plus any additional aggregate checks agreed in that scope. No such
rehearsal or additional data query was performed here. A retention/ownership
decision is needed only if the separately reviewed evidence establishes a case;
this pass did not discover populated Subscription/WebhookLog retention blockers.
Remote migration, application activation and deployment remain separate gates.

Preparation follow-up: [C1_MIGRATION_REHEARSAL.md](C1_MIGRATION_REHEARSAL.md) now
specifies the staged commands, extra aggregate/catalog SQL, pinned file hashes
and stop conditions. This was source-only preparation, with static validation;
it added no backup access, database queries or migration execution.
