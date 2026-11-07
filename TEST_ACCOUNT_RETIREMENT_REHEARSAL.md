# Six legacy test accounts — revised transition, 2026-11-06

**Explicitly authorized and completed on 2026-11-07, isolated b004 copy only.**
See [TEST_ACCOUNT_RETIREMENT_RESULTS.md](TEST_ACCOUNT_RETIREMENT_RESULTS.md): six
local users retired, archive preserved, all six migrations passed, and all
temporary copies removed. The procedure and original authorization wording below
record the completed scope; they do not authorize another run or live changes.

The owner states that nobody has ever paid and that these accounts belong to
owners/friends, and accepted retiring them so they can recreate accounts through
the new workflows. That supersedes the default identity-preservation proposal in
[LEGACY_ACCOUNT_TRANSITION_DESIGN.md](LEGACY_ACCOUNT_TRANSITION_DESIGN.md).
This is a one-time prelaunch test-data disposition, not the normal D9 account
deletion workflow or a change to customer deletion policy.

This preparation accessed only local source/documents. It retrieved no backup,
queried no database/provider and changed no application/schema/migration code.

## Recommended sequence

1. Prepare and validate the exact targeted cleanup with synthetic fixtures.
2. Under separate authorization, restore only b004 into a fresh protected local
   cluster, remove only the six approved test identities and their specified
   dependent test rows, then rerun all six unchanged migrations and C1 checks.
3. Review the sanitized result before preparing any live cleanup/rollout.
4. Once the approved environment is ready, have owners/friends register and prove
   email ownership through the normal signup/login flow. This tests the intended
   account-first purchase workflow. Restore the intended owner's administrator
   role separately against their newly verified persisted account; signup itself
   remains unprivileged.

The old accounts are unnecessary as regression fixtures: synthetic tests already
cover purchase/access/deletion. New accounts better test the normal workflow.
No legacy mode or selected-subscription backfill is needed for these accounts.

## Source and isolation

Use the exact b004 source identity/hash and private retrieval/restore protections
from [C1_MIGRATION_REHEARSAL.md](C1_MIGRATION_REHEARSAL.md). Its earlier execution
is fulfilled, so it does not authorize this new download or deletion.
Create a new owner-only socket-only local cluster; never use application A,
BROWN, an existing local database or a retained rehearsal copy. Stop on changed
backup/hash, unavailable tools, unexpected source schema/ledger or any errors.

Clean the **restored pre-identity baseline**, before migration 01. Require the
same 24 matching historical entries, exactly six Users, the observed six nonempty
customer references, absent modern identity/billing tables, and empty
Subscription/WebhookLog. Stop on any additional/missing user, unsupported table,
unexpected incoming foreign key or nonempty legacy billing evidence. Do not adapt
this procedure to a database already at an intermediate schema.

## Exact cleanup boundary

| Structure | Permitted proposed local action |
| --- | --- |
| User | Delete only the six IDs privately established from the exact verified b004. No delete-all endpoint, email matching, TRUNCATE, cascade option or sequence reset. |
| Token | Delete only legacy authentication rows whose userId is in that exact six-ID set. Select no token values. |
| TrackPlay | Delete only individual test-listening rows whose userId is in that exact set. Preserve aggregate Track.plays. |
| Subscription / WebhookLog | Must be empty before cleanup. No deletion to force a pass; unexpected rows stop the run. |
| LoginProof / IdentitySession / CheckoutOwnership / IdentityRateLimit / BillingCustomer / BillingOperation / PaidInvoiceGrant / StripeEventReceipt | Must be absent on the baseline. Do not manufacture tombstones or apply the procedure to populated modern structures. |
| Track, Artist, Category, Event, Location, MediaType, Raga, Tape, TrackArtist, Tribute | Preserve every row and field, including Track.url, Track.plays, catalog notes and tributes. No media-provider calls or asset deletion. |
| NetworkError | Preserve unchanged. This retirement is not a privacy-erasure claim; historical diagnostics and the provider backup can still contain test-account details. Scrubbing them would be a separate explicit scope. |
| _prisma_migrations / sequences | Do not alter during cleanup. Only Prisma subsequently writes its migration ledger; do not reuse old identity IDs. |

Unrelated/orphan Token/TrackPlay rows are not silently included. Report their
existence only if within the approved aggregate checks; resolving them would be
separate work. Do not infer ownership of free-text Tribute records from names.

## Prepared transaction and execution contract

[TEST_ACCOUNT_RETIREMENT.sql](TEST_ACCOUNT_RETIREMENT.sql) supplies the concrete
transaction with a fixed table allowlist and no application import. It passed
ten synthetic-only scenarios; no existing-data execution occurred. A separately
authorized runner must verify the isolated baseline and load the exact private
target pairs into the same session. It uses one transaction with timeouts.

Prepared cleanup SHA-256:
`ba799172644bf08a2450f79629ce44c04d0fdb6c24ebbb56232917720669ec38`.
Reverify this and the unchanged original migration/inspection manifest before
existing-data execution; stop on drift rather than silently approving new bytes.

- Privately establish the six exact `(User.id, User.stripeId)` pairs from the
  hash-verified backup. Do not print/save those values in repository files.
- Load those six expected pairs into a transaction-local target table. Lock and
  compare the current rows to the entire expected set; require exactly six
  matches and no extra users. Stop if any record/reference changed.
- Repeat schema, incoming-reference, ledger and empty-evidence checks inside the
  transaction. Do not rely solely on a prior count of six.
- Record aggregate counts for targeted Token/TrackPlay rows. Privately compare
  protected archive/diagnostic rows before and after, using bounded deterministic
  row fingerprints/counts; retain only unchanged booleans and totals. No row
  contents, URLs or fingerprint material should enter the report.
- Execute only the following deletion shapes, with explicit predicates:

```sql
DELETE FROM public."Token"
WHERE "userId" IN (SELECT "userId" FROM pg_temp.retirement_targets);
DELETE FROM public."TrackPlay"
WHERE "userId" IN (SELECT "userId" FROM pg_temp.retirement_targets);
DELETE FROM public."User"
WHERE id IN (SELECT "userId" FROM pg_temp.retirement_targets);
```

- Require exactly six deleted User rows and the previously counted dependent
  totals, no remaining targeted dependencies, unchanged protected content and
  unchanged baseline migration ledger. Commit only after every postcondition;
  otherwise roll back, stop and remove the disposable copy.

The prepared file adds the target guards, assertions, locks and private content
fingerprint comparison around these predicates. MD5-based row fingerprints are
bounded operational change detectors, not a proof against deliberate collisions;
the fixed mutation allowlist supplies the primary preservation boundary.
The runner must populate the exact target pairs privately in the same session
and capture all output/diagnostics without printing record values. Neither the
snippet nor the file is authorized for live execution by this policy acceptance.

## Rehearsal checks

Synthetic validation must cover six test accounts plus protected archive/tribute
fixtures, auth/listening rows, unchanged aggregate play counts, refusal of a
seventh user, wrong source/schema, changed target references and unexpected
billing/foreign-key evidence. An injected failed assertion must leave all rows
intact after rollback. Do not test deletion against any external provider.

After successful local baseline cleanup, expect zero Users and no targeted
Token/TrackPlay rows, with all protected content unchanged. Run the six staged
Prisma prefixes from the existing pinned manifest, one at a time. The billing
migration should then insert zero BillingCustomer rows; all nine pre-C1 guards
must evaluate to zero. Only then run final C1 on that copy and verify 30 complete
matching ledger entries, intended object removals and preserved archive content.
This expected outcome is not yet an executed result.

The prior rehearsal's stable user count of six is deliberately replaced by a
documented cleanup transition **6 -> 0 before stage 01**, then a stable zero
through all six stages. Do not reuse its old count assertions without updating
the separately reviewed runner. SQL inspection/migration source bytes remain
unchanged. Stop on any nonzero/NOT EVALUATED guard or failed stage.

Keep normal D1–D10 safeguards and C1 refusal tests unchanged. No new accounts,
real emails, Checkout sessions or administrator grants are created in the
existing-data rehearsal. Synthetic tests separately cover fresh signup/login,
unprivileged registration, owned Checkout association and paid-evidence checks.

Stop every generated server, verify its PID exited and remove all local dumps,
clusters, target sets, fingerprints and raw diagnostics before ending the run.
Retain only the sanitized outcome. Do not delete b004 on Heroku.

## Later live testing and remaining permissions

Account recreation happens in a designated approved testing environment. Live
testing of the app does not itself mean authorization to charge in Stripe live
mode. Confirm intended Stripe account/mode separately. Existing Stripe test
customers/subscriptions/sessions are not removed by app-account retirement;
their disposition and any provider changes are separate. Owner reports of no
past payments do not imply permission to cancel provider objects automatically.

The accepted direction allows preparing this simpler test-data plan. The cleanup
SQL is prepared; synthetic validation and the private runner/target review are
required before any existing-data execution. Synthetic validation is now complete;
the private backup runner/target review remains part of the execution preparation.
The later authorization must explicitly cover b004-only retrieval/restore,
targeted local deletion and its additional aggregate/fingerprint reads, the six
unchanged local migration stages, and temporary-copy cleanup. It must continue
to exclude live database changes, provider mutations, application startup,
deployment, commits/push/merge and blanket database resets.

A successful isolated rehearsal would support preparing a separate live rollout;
it would not execute or approve one. The owner's verified administrator role
must be deliberately re-established after fresh signup, never copied through a
browser password or granted to all recreated friend accounts.

## Completed preparation validation

On PostgreSQL 18.4, ten disposable synthetic scenarios passed: successful removal
of six fake users and their six auth/six listening rows with unrelated records
preserved; refusal/rollback for a seventh user, changed customer reference,
nonempty billing evidence, unexpected incoming FK, modern schema and an injected
post-delete failure; refusal without mutation for wrong database, wrong app
marker and missing private target set. All protected-content comparisons passed
in the success case. The synthetic server was stopped and its directory removed.
No b004 retrieval, existing-account query/deletion, migration or provider call
occurred during this preparation. The cleanup/migration combination on b004 is
not yet verified.

The separate existing-data rehearsal can be authorized as:

> I authorize TEST_ACCOUNT_RETIREMENT_REHEARSAL.md on an isolated local b004 copy:
> retrieve/restore only the verified b004, privately establish its exact six
> test-account targets, run TEST_ACCOUNT_RETIREMENT.sql with the listed scoped
> deletions and private preservation checks, then run all six unchanged staged
> migrations only if every guard passes. Remove all generated local data afterward
> and retain only sanitized findings. No live database changes, provider mutations,
> new backup, application startup, administrator grants, deployment, commit, push
> or merge.
