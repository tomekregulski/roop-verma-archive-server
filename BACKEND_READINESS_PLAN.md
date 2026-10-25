# Bounded Heroku recovery/readiness plan — 2026-10-25

**Local authorization update — 2026-10-25:** the catalog/admin task is complete
locally: all 24 catalog create/update/delete routes and the three owner-approved
tribute management routes now require verified, unexpired, non-revoked identity
and the current server-side admin role, with CSRF/origin enforcement. Node
24.19.0: 70 focused checks and all 140 backend synthetic regression checks pass.
The [current handoff](BACKEND_BASELINE.md) contains the route inventory, policy,
exclusions, test limits and the unchanged media-type update target bug. Public
reads, telemetry paths, billing, provisioning and frontend are unchanged. Tribute
POST is now admin-only after confirming no frontend submission form/caller exists.
No remote work occurred in this implementation task. Media entitlement and
deployed verification remain unresolved; restoration remains deferred.

Decision recommendation: **defer restoration and continue local authorization
fixes**. Restricted recovery is an option only after the evidence and controls
below are verified. This is preparation, not production readiness or containment.
Owner-approved metadata SQL is complete; no customer records were read and no
infrastructure/hosted application changes or migrations were made.

## Evidence and limits

Read both repositories' guidance, READMEs, current BACKEND_BASELINE.md and
DEVELOPMENT_NOTES.md, plus identity/operations contracts and deployed-source
migrations. Existing uncommitted assessment documentation was preserved.

| Finding | Evidence/status |
| --- | --- |
| Backend f25c4158 / v161 | CLI/provider API confirms current succeeded release and full slug commit f25c4158a08c092def49fa6e000e2f3262974021. Released 2026-10-25 10:35:44 EDT. Local server HEAD/relevant source matches. Successful release does not establish startup or migrations. |
| No web dynos | Empty dyno list; formation is web quantity 0, Eco, npm start, last updated 2026-09-01 03:40:36 EDT. Retained router logs show H14, including 2026-10-25 10:37:57 EDT after v161. This explains logged 503s without alleging a startup crash. No scaling/restart performed; Eco subscription/billing eligibility not inspected. |
| Platform/build/startup | Cedar, heroku-24, US, maintenance=false, no Private Space. Slug declares only web: npm start, no release process. Matching build succeeded; filtered build diagnostics show unspecified engines.node and npm 11.19.1. Exact deployed Node version remains unverified. Retained logs yielded no recognized application startup/config error or runtime version; startup remains unverified. |
| Identity configuration prevents startup | Presence-only API inspection confirms AUTH_RATE_LIMIT_SECRET, RESEND_API_KEY and LOGIN_EMAIL_FROM absent/blank; CLIENT_URL present. Source requires them before listen. This is an independent startup blocker, not a captured boot exception. |
| Webhook configuration absent | STRIPE_WEBHOOK_SECRET absent/blank confirmed; source returns 503 before dispatch without it. Signature enforcement exists locally; hosted enforcement unverified. |
| Production-designated DB, Stripe test mode | Production designation remains owner report; API credential prefix confirms test mode without displaying the credential. Test Stripe does not make database writes safe or synthetic. |
| Application A and shadow B are distinct | DATABASE_URL matches the provider's canonical DATABASE resource A (Essential-1); HEROKU_POSTGRESQL_BROWN_URL matches BROWN resource B (Essential-0). Compared parsed host/port/database identities in memory, ignoring credentials: different resources, hosts and databases; both select public schema, no unreviewed options. No other-app attachments reported. B's contents, independent workload and disposability remain unverified. |
| Database provider summaries | Both Available, PostgreSQL 15.18, 0/20 connections at inspection. A: 9.28 MB, 17 tables; B: 8.52 MB, 12 tables. Provider summaries only, no SQL/customer records. Current Prisma defines 20 model tables; counts alone cannot establish table names or migration state. |
| Recovery metadata | App transfer list has zero logical backups, zero restore jobs and three successful historical copies (2023-05-15, 2024-02-12, 2024-02-14). Both resource schedule lists empty. Historical copy source/target names and URLs could not be matched to current A/B; lineage remains unknown. No backup age/usable logical recovery point or restore duration can be established. Copies are not retained backups or verified restores. |
| Approved SQL: migration history | Sections A and B completed against application A only, on 2026-10-25 at 12:45–12:49 EDT. Public migration ledger has 24 completed entries, all matching SHA-256 of the committed migration files in f25c4158; no unfinished/rolled-back entries or nonempty log bodies indicated. The sole unapplied local migration is 20261017160000_email_identity. |
| Approved SQL: schema | LoginProof, IdentitySession, CheckoutOwnership and IdentityRateLimit are all absent, so their required indexes/foreign keys are absent too. All 16 pre-identity model tables are present. Existing model column types/nullability match schema.prisma except NetworkError.errorCode, which is INTEGER NOT NULL versus Int?. NetworkError.timestamp is already NOT NULL. Observed catalog constraints are validated. Two additional public objects occur in column metadata but were not classified; no complete schema-equivalence claim. |
| Frontend production and previews use production API | Current owner-reported rvdl-ui settings across all contexts; deployed frontend 244d87e. rvdl-ui-sb contexts target a deleted backend. Individual preview builds/access remain unverified. |
| Local checks versus hosted readiness | Catalog/admin guards now pass 70 focused and 140 total synthetic checks on Node 24.19.0. Six historical disposable PostgreSQL identity checks were not rerun for this guard-only change. Catalog enforcement is local evidence only; media entitlement, deployed verification, billing consistency and schema drift remain open. |

**Access update:** after Chrome Computer Use was not approved, the owner authorized
official Heroku CLI installation and completed login. Heroku CLI 11.12.1 and its
bundled authenticated API client were used for provider metadata. All direct API
requests were GET-only; bounded CLI log reads used Heroku's log-read mechanism.
Connection/config values and raw diagnostics stayed in memory and were not
displayed or saved. Only sanitized findings were retained; no credentials were
copied into repository files. Subsequently, the owner explicitly approved the
prepared SQL; details and limits are recorded below.

## Approved schema inspection result

Executed the exact SQL in [READINESS_METADATA.sql](READINESS_METADATA.sql),
SHA-256 ec87424f8df21072bdd7b5839769420d0a010befe477bc806b70ee3bcff3b823.
Section A confirmed the expected public ledger columns before Section B ran.
Application target mapping was reverified before each connection; shadow B was
not queried. Connections used TLS with certificate/hostname verification and
the official AWS RDS public CA bundle. Initial attempts stopped before any SQL
because the local trust store lacked that issuer; verification was not disabled.
This external-client requirement is documented by
[Heroku's connection guide](https://devcenter.heroku.com/articles/connecting-heroku-postgres#heroku-postgres-ssl).

Connection startup requested default_transaction_read_only=on. Each SQL section
used BEGIN READ ONLY, five-second statement timeout, one-second lock timeout,
and ROLLBACK; Section A confirmed transaction_read_only=on. Only catalog metadata
and selected migration-ledger fields were read. Log bodies, customer records,
proof/session values and application payloads were not read. Saved findings
contain no connection strings or private URLs. These were session settings,
not persistent database configuration changes.

**Implication:** v161's identity operations cannot work with this schema even
after compute/config recovery. The pending identity migration is additive
(four new tables, indexes and three cascading User foreign keys); no existing
user-data backfill is specified. This finding is not authorization to apply it.
The historical timestamp/uniqueness migrations are already recorded applied,
so they are not pending replay work. Keep the telemetry mismatch as a separate
reviewed contract/forward-migration decision; do not edit historical migrations.

## Collection method and remaining evidence gaps

The CLI follow-up completed provider metadata collection. Continue only where
evidence remains unavailable; the procedure is retained for review:

1. Record release/slug revision, stack/buildpack, actual Node/npm versions,
   build/release/start commands, web process count/type/state and last transition.
   Repo has no Procfile/release script or package engines; start is nodemon
   index.js and .nvmrc requests 24.19.0. Neither proves the deployed runtime.
   Inspect a bounded startup window around v161: report only timestamps,
   process state/exit code, router error codes and recognized configuration error
   names. Do not dump logs: request paths may contain the public key; payloads,
   recipient details and connection errors may contain sensitive data. If logs
   have expired, mark unavailable; do not restart to generate evidence.
2. Compare application DATABASE_URL against attachment resource IDs and parsed
   database/host/port identifiers **in memory**, reporting only labels A/B and
   equal/distinct/unknown. Also compare the shadow target and resource lineage;
   different config names, credentials or literal URLs do not prove distinct DBs.
   Check for manual URL overrides, other app attachments and connection options
   selecting another schema. Never print URLs, passwords, hostnames or hashes of
   credentials. Confirm app uses the intended resource; confirm BROWN has no real
   workload/data and is explicitly disposable. Do not query BROWN to infer this.
3. Read backup list, schedules and individual metadata: source resource A/B,
   backup ID, status, capture/completion timestamps, size, retention/expiry and
   any prior restore job's target/status. Do not generate a backup download URL,
   download a dump, capture, copy or restore. Record oldest/newest usable point
   and backup age; a completed backup is not a verified restore.

The provider collection above required no database SQL. The separate SQL
authorization has now been granted and used only for the reviewed sections:
[READINESS_METADATA.sql](READINESS_METADATA.sql) contains the exact proposed
queries. Section A reads version and schema catalogs (columns/defaults, indexes,
constraints and ledger location); B reads only migration names/checksums/status
timestamps/step counts and a log-presence boolean. Both use READ ONLY, timeouts
and ROLLBACK; neither selects customer records, tokens, emails, webhook records
or migration log text. Review any unexpectedly sensitive schema definitions
before reporting. No application startup, one-off app dyno, Prisma command,
customer counts or data-quality queries are authorized. A client connection must
use the verified target privately with read-only mode from connection startup;
no credential in command arguments/output/history. Stop on permission errors,
timeouts, absent/non-public ledger or unexpected schema; do not repair remotely.

## Schema and recovery sequence (future, separately authorized)

The reported deployed revision contains **25 Prisma migrations**, ending in
20261017160000_email_identity. Compare the ledger to SHA-256 checksums of the
exact committed SQL bytes, including failed/unfinished/rolled-back entries;
do not infer success from a migration name or latest timestamp alone. Verify
LoginProof, IdentitySession, CheckoutOwnership, IdentityRateLimit, their keys,
expiry indexes, defaults and three cascading User foreign keys, plus existing
User/Subscription/telemetry metadata against schema.prisma and historical SQL.
An absent ledger is a baseline investigation, never permission to replay blindly.

Confirmed mismatch: 20240211171404 makes NetworkError.errorCode INTEGER NOT NULL,
while schema.prisma declares Int?. Both disposable replay and approved remote
metadata show that mismatch. Historical timestamp/unique migrations are recorded
applied; timestamp is already NOT NULL. Their data-quality hazards matter for
future reconstruction/rehearsal, not as pending remote migrations. Metadata
cannot establish customer data quality; no such queries were included here.

Mapping/history and the missing identity schema are now established; a usable
logical backup and restore remain open.
Order: establish backup/recovery evidence → resolve drift policy locally
with an explicit forward migration if needed → replay and test on a disposable
local DB → separately authorize a protected restore rehearsal → review the exact
pending migration set and recovery window → separately approve any remote work.
Never run migrate dev, reset, db push, migrate resolve or even a migration-status
command against remote databases in this scope. A future deploy migration needs
its own reviewed target, command, backup and authorization. Shadow independence
must be established before any development migration; never use production as
shadow scratch space.

Recovery options: a successful logical backup can be restored into a separately
approved isolated target; keep mail/Stripe/jobs disconnected and control access
to copied production data. Rehearse restore completion, schema and app compatibility
before claiming recoverability; synthetic replay alone does not verify a backup.
Correction to the initial plan: the provider reports Continuous Protection On
for both databases, but Rollback and Fork/Follow Unsupported. Current
[data-safety documentation](https://devcenter.heroku.com/articles/heroku-postgres-data-safety-and-continuous-protection)
confirms provider physical backups also cover Essential; it does not grant
Essential customers rollback access. Do not treat this as a user-selectable PITR
window or a rehearsed restore. Heroku's older help article below conflicts on
Essential Continuous Protection; prefer the current data-safety documentation
and actual provider metadata. In-place logical restore deletes
the target's data and loses post-backup changes. Backup age bounds potential loss;
restore time remains unknown until rehearsal. Release rollback cannot undo DB
changes, sent mail or Stripe effects; an older release may reintroduce auth flaws
or incompatible schema. Config changes can also create releases/restarts.
See [PGBackups](https://devcenter.heroku.com/articles/heroku-postgres-backups),
[older help article](https://help.heroku.com/5NW2GC8C/my-database-should-have-continuous-protection-why-don-t-i-see-any-backups)
and [release rollback](https://devcenter.heroku.com/articles/releases).

## Access choice and previews

| Choice | Effort/cost and consequences |
| --- | --- |
| **Defer restoration (recommended)** | No new hosting spend or gate implementation. Existing DB/add-on charges continue; deferment is not a security control and 503 is not verified containment. Work locally with synthetic providers/data; hosted login, mail and webhook/browser verification remain pending. Catalog/admin authorization is now implemented and synthetically tested locally (see current handoff); media entitlement remains separate work. |
| Restore for restricted testing | First complete mapping/schema/backup readiness and implement/test a fail-closed API gate. A practical small-team candidate is a fixed tester/VPN egress IP allowlist enforced by the application before all routes/static/OPTIONS, covering every hostname including herokuapp.com. Requires verified trusted-proxy/IP derivation and spoofed-forwarding tests; do not trust arbitrary X-Forwarded-For or merely set trust proxy to true. It admits anyone on the allowed egress, so account/role/entitlement fixes still matter. If stable egress or robust IP verification is unavailable, defer rather than ship an assumed restriction. |

The gate is a proposal, not present protection. Verify denial from an outside
network and direct default-domain access, and success from the approved network.
Frontend password/SSO protects only that frontend. A proxy/custom-domain gate
alone is bypassable if the default origin still accepts requests. CORS controls
browser response access, not direct API access. The gate cannot revoke existing
Cloudinary URLs or contain media served directly by Cloudinary.

Login works only from an allowed network and still needs delivered mailbox proofs
and working cookies. Do not embed a development gate secret in Vite builds or URLs.
Stripe deliveries will be denied by a tester-IP-only gate. Keep them denied unless
the owner explicitly approves exposing only POST /api/v1/payment/webhooks with
existing signature verification before any effects, bounded bodies and no other
route bypass. That exception permits genuine Stripe events to mutate the DB;
signatures do not fix duplicate/order/partial-write bugs. No test-event delivery
against the production-designated DB until an explicit safe-data decision.
Blocked webhooks mean registration provisioning/Checkout cannot be claimed working.

Published [Heroku prices](https://www.heroku.com/pricing/) checked 2026-10-25:
reported Essential-1 + Essential-0 = $14/month; with Eco $19, Basic $21, before
media/mail/domain/tax and any VPN cost. Actual billing/compute is unverified.
Existing DBs alone nearly exhaust the $10–15 development budget; retain rather
than resize/remove them in this scope. Restricted recovery adds several bounded
implementation and verification tasks, likely multiple 2–4 hour weekly sessions;
no precise estimate before access/schema evidence. No broad hosting migration.

**Before browser testing resumes:** separately authorize changing rvdl-ui Deploy
Preview/Branch/Preview-server API configuration to a synthetic local/test target,
or leave API-backed preview testing disabled until such a target exists. Never
fall back to production or the deleted sandbox. Leave production context separate.
Rebuild any approved preview after configuration changes; older deploy artifacts
retain embedded origins. Verify the actual build's API origin and network traffic
before login/signup/payments. Netlify access protection is supplementary. Current
backend accepts a single CLIENT_URL, so arbitrary preview origins are not supported;
prefer one fixed approved testing frontend, not a wildcard allowlist. Gate tests
run from the tester's browser network, not Netlify's build egress.

## Configuration and verification decisions

Record presence/role only; owner enters secrets through secret management.

| Names | Required role/decision |
| --- | --- |
| DATABASE_URL; HEROKU_POSTGRESQL_BROWN_URL | Verified app target versus independent disposable shadow; shadow is not needed for normal app queries. |
| AUTH_RATE_LIMIT_SECRET; RESEND_API_KEY; LOGIN_EMAIL_FROM | Missing startup config: random >=32-character rate secret; approved mail provider key and verified sender. Designate test inbox and disable proof-link click tracking; acceptance is not inbox delivery. |
| STRIPE_SECRET_KEY; STRIPE_WEBHOOK_SECRET | Test API credential versus exact test endpoint signing secret; validate event/API version, subscribed types, hardcoded price, portal and frontend publishable-key mode. Missing signing secret currently blocks dispatch. |
| CLIENT_URL; VITE_API_ORIGIN | One exact HTTPS frontend origin and matching API target; governs CORS and mail/payment returns. Preview policy above. |
| SESSION_COOKIE_SECURE; SESSION_COOKIE_SAME_SITE | Secure=true; HttpOnly host-only __Host-rv-session, Path=/, no Domain. Shared registrable-domain HTTPS frontend/API supports Lax; current Heroku/custom-frontend cross-site arrangement requires None+Secure and may still fail browser third-party-cookie policy. |
| TRUST_PROXY_HOPS; PORT; NODE_ENV | Verify actual proxy chain before selecting hops; preserve rate-limit/IP integrity. Listen on platform PORT; production runtime mode. Confirm deployed Node/npm and Prisma generation/native dependency behavior against local supported runtime. |
| API_KEY; proposed DEV_ACCESS_ALLOWED_IPS | API_KEY is public compatibility configuration, not authorization. Proposed IP list is gate-only configuration, absent today; fail closed if missing in restricted mode. No JWT_SECRET identity dependency. |

Choose shared-site API domain/certificate/DNS and a fixed test frontend before
claiming browser reliability; these require separate authorization. Do not weaken
Secure cookies to work around hosted failures. Future verification must demonstrate
startup/runtime, outside-network gate denial (including default hostname), exact
CORS with reachability controls, cookie restoration/CSRF/logout/proof expiry,
designated inbox delivery, and signed/rejected test webhook effects only on an
approved target. Preserve outstanding authorization/billing blockers explicitly.

Presence-only follow-up: SESSION_COOKIE_SECURE, SESSION_COOKIE_SAME_SITE and
TRUST_PROXY_HOPS are not configured, so source defaults are Secure=true,
SameSite=Lax and proxy hops=0. Those defaults still need domain/proxy review.
NODE_ENV is absent from app config vars; buildpack/runtime defaults were not
inspected, so do not infer the running process's effective value.

## Smallest next task and authorization boundary

Provider metadata collection and approved schema inspection are complete within
the recorded limits. Smallest next implementation proposal: a local telemetry
nullability decision/fix and synthetic migration rehearsal for the exact schema
transition (24 historical migrations → pending identity migration plus any new
reviewed telemetry migration). This requires a new local implementation scope;
no more remote reads are necessary for the current decision. Local authorization
fixes remain the recommended restoration-deferred path.

If restricted recovery is selected instead, separately approve backup capture
for A and an isolated restore rehearsal/data-handling plan before any remote
migration. The future remote migration proposal must name only the reviewed
pending migrations and target A; do not replay the 24 applied migrations or use
shadow B until disposability is confirmed. Runtime Node version, B's lineage,
access restriction, preview separation and a usable recovery point remain open.

The owner's SQL approval covered sections A and conditionally B only and has
been fulfilled. It does not authorize repeat/broader data inspection, shadow SQL,
migrations, restore or traffic changes.

Separate future approvals must name: local authorization/gate implementation;
preview settings and rebuilds; secret/config entry; DNS/cert/proxy changes;
paid compute/resources or scaling; backup capture/scheduling/copy/restore and data
handling; each remote migration; deployment/restart/traffic enablement; and any
real mail/Stripe test. None are authorized or performed here. No push or merge.
Decision can be made now in favor of local work; restricted restoration remains
conditional on the unverified prerequisites, not an immediate recovery instruction.
