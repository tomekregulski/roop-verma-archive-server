# Isolated test-account retirement rehearsal — 2026-11-07

**PASS: targeted local cleanup followed by all six unchanged migrations.**
The owner explicitly authorized [TEST_ACCOUNT_RETIREMENT_REHEARSAL.md](TEST_ACCOUNT_RETIREMENT_REHEARSAL.md)
on an isolated b004 copy only. This authorization is now fulfilled. The live
database/accounts were not queried or changed; no provider billing/resource
settings, application startup, deployment, commit, push or merge occurred.

## Verified source and target

| Evidence | Result |
| --- | --- |
| Backup | b004 / e4ce90f3-e806-4c89-b179-5745ed9bf3e6 |
| Application mapping | Reverified canonical application A / DATABASE / Essential-1 on roop-verma-archive |
| Shadow | Reverified distinct BROWN resource/database; not queried or used |
| Capture completed | 2026-11-06 11:12:00 UTC / 06:12:00 EST |
| Retrieval | 2026-11-07 13:31:14 UTC / 08:31:14 EST; capture age 94,755 seconds |
| Archive | 52,713 bytes; PostgreSQL custom format |
| SHA-256 | 16b6a1439bf82e206621d04873146380cb595f193c04e35a8e2d3e79d3759539 |
| Archive review | Same 17 base tables and reviewed pg_stat_statements extension; no unsupported object types |
| Local restore | Success; single transaction, no owner/ACL/tablespace replay; 0.043 seconds |
| Tools | Node 24.19.0, Prisma CLI 4.12.0, PostgreSQL/psql/pg_restore 18.4 |
| Isolation | Fresh owner-only temporary directory, rvdl_c1_b004 database, private Unix socket, no TCP listener |

Heroku activity was limited to mapping/backup metadata and retrieving the existing
exact backup. No new backup was captured, no remote database SQL ran, and no
Stripe/Cloudinary calls were made. Credentials/signed URLs stayed in memory.

All original files in [C1_REHEARSAL_MANIFEST.json](C1_REHEARSAL_MANIFEST.json)
matched their pinned hashes before and after execution. The cleanup SQL matched
`ba799172644bf08a2450f79629ce44c04d0fdb6c24ebbb56232917720669ec38`.
No historical migration, schema, application or inspection SQL bytes changed.

## Validation and local cleanup

The ten prior synthetic cleanup/refusal/rollback checks remain documented in the
approved plan. This run additionally validated the **combined** cleanup plus all
six exact staged Prisma migrations on six synthetic historical users. A targeted
fake Token/TrackPlay row was removed and unrelated rows survived. No backup was
accessed until that integration passed. The preservation check was corrected to
allow only the expected final removal of WebhookLog's SERIAL-owned sequence;
retained sequences, including User's identity sequence, were not reset.

On the actual restored b004 baseline, the ledger had the same 24 completed,
checksum-matched historical entries and the expected pre-identity schema. Six
exact user/customer-reference pairs were privately established in memory and
loaded into a temporary target table in the cleanup's own psql session. No IDs,
emails, customer values, token values, row contents or fingerprints were printed
or stored in the repository.

The pinned cleanup ran in one transaction with target, exact-set, schema,
incoming-reference, empty-billing-evidence, row-count and preservation assertions.
It committed only after every postcondition passed:

| Deleted structure, on the disposable copy only | Rows |
| --- | --- |
| Exact six legacy User records | **6** |
| Token rows linked to those six IDs | **0** |
| Individual TrackPlay rows linked to those six IDs | **0** |

Protected table counts/fingerprints matched inside the cleanup transaction:
Track, Artist, Category, Event, Location, MediaType, Raga, Tape, TrackArtist,
Tribute, NetworkError, the baseline migration ledger, empty Subscription and
WebhookLog, and any unrelated Token/TrackPlay records. Aggregate Track.plays,
media URLs and tribute/catalog content were unchanged. Baseline sequence state
also matched before/after cleanup. No TRUNCATE, identity reset, guessed selection,
association backfill, tombstone fabrication or broad delete was used.

## Migration outcome

After cleanup, zero users remained on the isolated copy. Each deploy used only
the exact reviewed migration prefix and a dedicated socket datasource, with no
shadow URL, inherited app environment or .env. Prisma maintained its own ledger.
Narrow read-only role inspection verified every ledger prefix/checksum, schema
column state, aggregate invariant and named constraint/index flags.

| Stage | Result / command seconds | Completed matching ledger entries | Users / BillingCustomer |
| --- | --- | --- | --- |
| After targeted cleanup | Verified | 24 | 0 / table absent |
| 01 — email identity | Success / 0.360 | 25 | 0 / table absent |
| 02 — billing evidence | Success / 0.352 | 26 | 0 / 0 |
| 03 — paid-access cache | Success / 0.339 | 27 | 0 / 0 |
| 04 — owned Checkout | Success / 0.349 | 28 | 0 / 0 |
| 05 — owner-assisted deletion | Success / 0.337 | 29 | 0 / 0 |
| 06 — C1 consolidation | **Success / 0.343** | **30** | **0 / 0** |

Immediately before C1, **all nine guard checks evaluated to zero**. No guard was
weakened, skipped or replaced with a manual ledger override. After C1, the exact
five legacy tables and seven removed columns were absent, while retained
constraint/index flags matched the pinned migration path. Removed-table row
queries were not rerun after removal.

Archive/diagnostic counts and private fingerprints matched the original restored
copy after cleanup and through every migration. Unrelated Token/TrackPlay data
also matched through migration. Retained sequence state was unchanged; the only
sequence removal was WebhookLog_id_seq when C1 dropped its owning legacy table.
Fingerprint comparison is an operational change detector, not a proof against
deliberate hash collisions or a physical-erasure guarantee.

## Cleanup and remaining scope

The successful synthetic integration cluster and the b004 cluster were stopped,
their exact PIDs verified exited, and their entire generated directories removed.
This removed all dumps, restored data, target sets, staged migration copies,
fingerprint material, sockets and private diagnostics. No residual copy remains.
The provider's b004 was retained. Existing working-tree changes were preserved.

This resolves the **b004 local data-transition rehearsal blocker** for the
owner-approved test-account-retirement approach. It does not change or approve
the current live database, prove unchanged live contents, or authorize deployment.
The backup is a dated snapshot; a later live procedure needs its own reviewed
source/backup/writer coordination, exact target set, commands and authorization.
PostgreSQL 15 deployment compatibility, known telemetry nullability policy,
operational config/mail/webhook verification and media delivery remain separate.

Future test accounts should use normal signup and email proof once the designated
environment is approved. No accounts, emails, Checkout sessions or admin grants
were created by this existing-data rehearsal. The intended owner must receive
administrator authority through a separate, explicit persisted-account process.
No Stripe test-customer/session/subscription cleanup or live-mode charging was
performed or approved by this run.
