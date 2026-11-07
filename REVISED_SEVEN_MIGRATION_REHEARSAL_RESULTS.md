# Revised seven-migration b004 rehearsal — 2026-11-07

**PASS for the isolated b004 copy and the source commits below. No live execution
is authorized by this result.** The original six-migration results/manifests were
preserved byte for byte; this is a separate evidence record.

## Reviewed inputs

| Input | Verified value |
| --- | --- |
| Server commit | afa8d1c77bd9180348873b7aa1a2a8f2760a4bd8 |
| Client commit | 86c9c1b3454344e93bdacbaa52af7afeb028c68b |
| Source/hash snapshot | [REVISED_SEVEN_MIGRATION_REHEARSAL_MANIFEST.json](REVISED_SEVEN_MIGRATION_REHEARSAL_MANIFEST.json) |
| Revised schema SHA-256 | b3cf6f43d9ec0dc729cd3a6093dae38a337f1e0f929731aa29120f22a361bb3f |
| Seventh migration SHA-256 | 85cb850740acae34c0736c6488f76acaaa4a91603bb77216624c4384611fa4cb |
| b004 transfer | e4ce90f3-e806-4c89-b179-5745ed9bf3e6 |
| Archive SHA-256 | 16b6a1439bf82e206621d04873146380cb595f193c04e35a8e2d3e79d3759539 |
| Archive bytes | 52,713 |
| Capture completion | 2026-11-06 11:12:00 UTC / 06:12:00 EST |
| Retrieval | 2026-11-07 17:53:03 UTC / 12:53:03 EST; capture age 110,464 seconds |
| Local tools | PostgreSQL/psql/pg_restore 18.4, Node 24.19.0, installed Prisma CLI 4.12.0 |

Both working trees matched the supplied commits and were clean before adding
this rehearsal's evidence. Current handoff, harness caveat, revised D2/D9/D10,
Operations and the new guarded migration were reviewed before any backup action.
The manifest records all 31 migration files (24 historical + seven forward),
current schema/lockfile, policies/handoff, relevant inspection/cleanup files and
both source Git tree IDs. The original 30 migration bytes and all 12 files in
REHEARSAL_EVIDENCE_INDEX.json still match their original hashes. The current
schema is deliberately a new hash; the original manifest was not regenerated.

Application A / DATABASE / Essential-1 mapping and distinct BROWN mapping were
reverified through Heroku metadata only. b004 identity, availability, successful
capture, source, size and exact artifact hash all matched; no substitute or new
backup was used. Signed URL/credentials stayed in memory. No live SQL ran.

The archive's exact 17 baseline tables and supported object types were reviewed
privately; pg_stat_statements remained the previously reviewed bundled extension.
Restore succeeded in 0.053 seconds into a new owner-only directory/database with
a private Unix socket, no TCP listener and a separate read-only inspection role.
No system service, application, frontend, browser harness or provider client was
started. No real billing/email/media action or provider setting change occurred.

## Disposition gate: checked before cleanup and again before migration seven

| Aggregate | Original restored baseline | Immediately before migration seven |
| --- | --- | --- |
| TrackPlay rows | **0** | **0** |
| NetworkError rows | **0** | **0** |

The initial check ran before any account retirement or migration. Therefore the
targeted cleanup could not conceal a global nonempty-store blocker. Counts stayed
zero after every intermediate stage. No TrackPlay or NetworkError records were
deleted, anonymized or exported. Both stores were removed only when empty by the
unchanged seventh migration. No disposition decision was needed for this snapshot;
a nonempty later source would still require one.

The initial public ledger contained exactly 24 complete, checksum-matched
historical entries, with no unfinished/rolled-back entries or indicated log text.
The prior NetworkError.errorCode column was confirmed NOT NULL before migration.
Its old model/DB mismatch is superseded here by verified guarded table removal,
not by suppressing the old diagnostic on a retained table.

## Synthetic verification before migrating the backup copy

Only synthetic clusters were used to validate the new execution/check path:

- Full retirement of six fake users followed by all seven staged migrations,
  including catalog/media/tribute fixtures with two tracks, stored plays 17 and
  NULL. Those per-track values, aggregate sum 17 and one NULL stayed unchanged.
- Separate nonempty TrackPlay and NetworkError fixtures: the exact seventh
  migration failed, retained the record, rolled back both store removals and all
  column/cache changes, and was not recorded successfully applied. No guard was
  edited or bypassed; each fixture used a fresh disposable cluster, with no
  retry/repair of a failed existing-data migration.
- A separate prior-schema authority fixture retained the pending deletion
  timestamp/revision, administrator flag, user/customer ownership, selected
  subscription, cancellation/deletion tombstones, immutable attempt tombstone,
  login proof and session. Only obsolete notification/cache state was removed;
  cache stamps were invalidated and new cachedStatus remained NULL.
- Final model column/index/FK checks passed on both synthetic success targets.
  The actual final cache-check definition matched the successful synthetic target.

These are database migration/preservation checks. Previously reported application
and browser tests in the implementation handoff were not rerun or claimed as new
results; their fake-provider and support-mail isolation limits remain intact.

## Actual isolated-copy sequence

The approved unchanged retirement SQL privately matched the six exact b004
user/customer-reference pairs in one session/transaction. It removed **six User
rows, zero Token rows and zero TrackPlay rows**. Every transaction preservation
assertion passed; no IDs, email addresses, references, raw diagnostics or record
fingerprints were displayed or saved in repository files.

Each Prisma deploy received only the exact staged prefix and a private socket
datasource, without .env, production config, shadow URL or an implicit install.
The ledger/checksums and local PID/socket/target were reverified before advancing.
No application client was generated/imported against the backup. No migration
guard, historical SQL or ledger entry was manually changed.

| Stage | Newly applied migration | Result / seconds | Complete matching ledger entries |
| --- | --- | --- | --- |
| Baseline / approved retirement | None | Verified | 24 |
| 1 | 20261017160000_email_identity | Success / 0.368 | 25 |
| 2 | 20261101120000_billing_evidence | Success / 0.343 | 26 |
| 3 | 20261101180000_paid_access_cache | Success / 0.346 | 27 |
| 4 | 20261101200000_owned_checkout | Success / 0.332 | 28 |
| 5 | 20261102000000_owner_assisted_deletion | Success / 0.348 | 29 |
| 6 | 20261102120000_c1_billing_consolidation | Success / 0.336 | 30 |
| 7 | 20261107120000_bounded_simplification | **Success / 0.337** | **31** |

All **nine original C1 guard counts evaluated to zero** before stage 6. Users
and linked users stayed at zero after retirement; BillingCustomer rows stayed
zero after creation. No fictional selection, mode or paid interval was assigned.

## Final schema and preservation

The final public model structure matched the current schema: **17 model tables
plus the Prisma ledger, all 102 scalar columns/types/nullability, 32 primary/
unique/index shapes and 11 validated foreign-key shapes/delete-update actions**.
Named constraint/index flags were valid; the revised status-cache constraint
matched the synthetic target, including active/past_due and fixed freshness.
No failed/unfinished ledger entry remained on the actual copy.

The five C1 legacy tables and seven C1 columns were absent. TrackPlay,
NetworkError, User.deletionNotice and both paid-period cache columns were absent;
cachedStatus was present. Pending state/revision, ownership/selection/veto and
attempt/security-tombstone columns remained. Source/default/check behavior is
anchored by the exact successful migration bytes; this was not a live runtime
or provider behavior test.

| Stored listen evidence | Before retirement | After all seven migrations |
| --- | --- | --- |
| Tracks | **74** | **74** |
| Sum of stored Track.plays | **0** | **0** |
| Tracks with NULL plays | **0** | **0** |

Deterministic private table counts/fingerprints matched throughout for Track,
Artist, Category, Event, Location, MediaType, Raga, Tape, TrackArtist and Tribute.
This includes the individual plays values and media-reference fields, rather than
just the total. Remaining Token content matched after retirement and throughout
migration. No totals were reset/reconstructed, no real listen POST was made and
no catalog/tribute/media row was rewritten. Fingerprints are bounded operational
change detectors, not a proof against deliberate hash collision.

Four synthetic clusters were stopped and removed. The parent process stopped the
exact b004 postmaster, verified its PID exited and removed the entire generated
directory: dump, restored database, target set, staged migration copies, sockets
and private diagnostics. No copied data remains. The provider b004 is retained.

## Remaining rollout blockers

1. **Live execution remains unauthorized.** Prepare/review the exact live source,
   fresh recovery evidence, current data and exact account target set; coordinate
   old-writer shutdown and generated-client/application rollout. b004 is dated
   evidence, not proof of today's live contents. Any current TrackPlay or
   NetworkError rows require explicit disposition before removal; do not infer
   permission from this empty snapshot.
2. **Deployed-platform compatibility and recovery.** This rehearsal used local
   PostgreSQL 18.4; deployed PostgreSQL 15/runtime compatibility, current hosting
   formation/configuration and the live recovery/rollback window need verification.
   A release rollback cannot undo database/data changes or external actions.
3. **Real provider/configuration verification.** Reverify Stripe account/mode,
   tier/product, Checkout/Portal, signing secret/events and revised status shapes.
   Review recovery/retry/eventual cancellation settings: the approved policy can
   allow indefinitely past_due access. Magic-email delivery, support delivery,
   deployed HTTPS/proxy/cookies and actual signed callbacks remain unverified here.
4. **New test identity/owner setup.** Recreate accounts through normal signup/email
   proof only in a separately approved environment, and explicitly provision the
   intended verified owner's persisted admin role. This run created no real user,
   session, email, Checkout or administrator grant.
5. **Private media and deployed end-to-end readiness.** Actual media mapping/signing,
   public-URL retirement, streaming/expiry/revocation and deployed request behavior
   are still separate gates. No live playback, monitoring service or production
   browser journey was exercised.

There is **no remaining b004 data-disposition blocker for this revised local
sequence**. The old required-NetworkError/nullability mismatch is not a final-
schema blocker after empty guarded removal. This PASS does not remove any of
the live/provider/deployment authorization boundaries above.
