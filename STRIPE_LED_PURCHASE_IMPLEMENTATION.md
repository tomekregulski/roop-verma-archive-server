# Isolated purchase and D9 deletion implementation — 2026-11-02

The owner explicitly authorized [STRIPE_LED_SIGNUP_CHECKOUT_SCOPE.md](STRIPE_LED_SIGNUP_CHECKOUT_SCOPE.md).
The local slice is implemented. **Normal backend/frontend routes still select the
old composition. No runtime cutover, old-engine removal, real
provider action, existing/remote DB access, deployment, restoration, push or merge.**
D1–D10 policy is unchanged. Temporary coexistence ends only through the bounded,
separately gated C1 task below; it is not the finished architecture.

## D9 owner-assisted deletion — current local handoff

The owner's bounded D9 brief supersedes older owner-control authorization gates.
`billing/deletion.js` and `identity/deletion-http.js` extend the same isolated
candidate factory; the frontend adds `OwnerDeletions` only in the purchase fixture.
Normal `app.js`, billing/runtime, AppContainer/main and legacy engine remain unchanged.
No provider/existing database/deployment/commit/push/merge action was performed.

- Reuses User.deletionRequestedAt, BillingCustomer, BillingOperation, the purchase
  advisory/User row lock, persisted sessions/admin/CSRF/no-store, Resend conventions
  and existing HTTP/React/disposable-PG fixtures. No new table, worker or dependency.
- Forward migration `20261102000000_owner_assisted_deletion` adds a request revision
  (withdraw/re-request ABA protection), notification outcome and explicit attempt
  deletion/customer/subscription references. It preserves applied migration history.
- Authenticated requests derive identity from the session, commit an idempotent
  purchase/association block, then attempt one support notification. Login, trusted
  Portal and ordinary playback policy continue. No automatic cancellation/refund.
- Configure `ACCOUNT_DELETION_SUPPORT_EMAIL` explicitly before eventual activation.
  Existing support is frontend EmailJS (`rvdl_forms`/template), with no backend
  destination available; no inbox was inferred. The staged Resend factory reuses
  login sender/key/timeout, reports acceptance only, and is fake in all tests.
  `attempted`, `uncertain` or `unconfigured` means delivery is unconfirmed. Crash,
  timeout or final status-write failure can lose notification; repeat pending
  submissions never resend. There is no guaranteed retry or exactly-once delivery.
- Owner review enumerates all local owned attempts, including inactive ones and
  trusted-customer legacy references. Exact Session/customer/subscription reads,
  immutable ownership/mode validation and actual terminal subscription status
  supplement Dashboard attestation. Missing IDs, open pages and unsupported legacy
  attempts remain blockers. Exact owner-supplied Session evidence cannot start a
  purchase, associate billing, return a hosted URL or grant access.
- Valid late provider responses/callbacks save Session IDs while pending. Review
  fingerprints reject mutable local changes; completion rereads exact resources,
  then rechecks local facts under the same account lock. No provider call holds a
  DB lock. Stripe and PostgreSQL cannot commit atomically: owner must recheck all
  Dashboard items immediately before attestation. This is not financial-history
  discovery or proof against arbitrary concurrent owner/provider mutations.
- Withdrawal is owner/support-assisted only, works with provider-unavailable review
  blockers, clears request flags, preserves all ordinary purchase safeguards and
  never alters Stripe. A new request gets a new revision and notification attempt.
- Completion atomically tombstones all known customers (including unassociated
  completed purchases), invalidates cache, tombstones/scrubs live v2 attempt JSON
  and deletes identity. Tombstoned attempts are rejected before immutable request
  validation; live attempts keep digest validation. Late/duplicate callbacks cannot
  recreate identity or adopt old billing after a same-email signup.
- Cascades revoke every session, proof and CheckoutOwnership; explicit deletion
  handles legacy Token and individual TrackPlay rows without touching Track.plays.
  Linked error diagnostics lose identity and entire free-text fields; the scan also
  detects known email/URL-encoded email, full name and labeled user-ID forms in
  otherwise unlinked messages. Codes/times remain. This is not a claim to erase
  arbitrary encodings, unlinked free text, emails, provider records, backups or logs.
  Tribute.submittedBy/content are unlinked author text, not reliable account
  ownership; their erasure policy and unrelated old telemetry/listening ingestion
  remain separate decisions. No play counting or telemetry-schema repair was added.
- Old/unsupported attempts or unrepresented legacy Checkout ownership fail closed
  for investigation; we do not scrub their immutable parameters to bypass checks.
  Existing-data/retention preflight belongs to C1. Difficult unknown outcomes can
  still require engineering; ordinary new-candidate deletions use the owner UI.
  Tombstone references have no automatic expiry. Stripe records remain untouched.

Current verification (Node 24.19.0; fake Stripe/mail/media throughout): **350
synthetic backend tests, 214 disposable PostgreSQL tests, 29 purchase/deletion React
browser assertions, 23 playback React assertions and 14 frontend unit tests pass**.
TypeScript (`--noEmit --emitDeclarationOnly false`), changed-source ESLint and
normal Vite build pass, with existing bundle/browser-data warnings. Strict schema
assessment remains **6 pass / 1 fail**, solely NetworkError.errorCode nullability;
it was not fixed or suppressed. Full suite bodies were about 1.2s/7.0s, excluding
startup/browser/tool waiting; these are not engineer labor measurements.

The real browser journey used fetch/cookies/HTTP/Prisma/disposable PostgreSQL:
signup/verification → fake purchase → deletion request → reload → Portal → real
persisted admin login/review → withdrawal → buyer login/new request → fake
Dashboard subscription closure → owner review/attestation/completion. The focused
React page separately checks errors, stale confirmation and logout/unmount races.
Ignored captures: client `test/evidence/deletion-owner-review.png` and
`deletion-complete.png`. No real provider behavior is established.

`npm run test:billing:local` and `test:purchase:local` now include D9; the existing
compatible runtime/EMBEDDED_POSTGRES_MODULE instructions below apply. The prior-
schema upgrade fixture explicitly excludes the new migration and inserts only
historical User columns, preserving mismatch/retention assertions.

D9's authorized **7–10 active engineer hours** was a planning estimate, superseding
older 3–5h D9 guesses; labor was not clocked. No broader recovery/admin/financial
scope was added. Remaining separately authorized billing planning is C1 **3–5h**
and real provider setup/verification **2–4h** (5–9h combined), excluding media,
deployment and existing-data exceptions. The quarterly-maintenance goal remains
unvalidated until C1 eliminates the parallel old engine and operations are exercised.

## What changed and what was reused

| Boundary | Implementation |
| --- | --- |
| `billing/purchase.js` | One staged replacement for purchase orchestration: local registration, action summary, reserve/resume owned Checkout, shared completion, Portal and narrow event dispatch. No history discovery, financial ledger, reconciliation or background work. |
| Existing `BillingOperation` | Reused as the only purchase-attempt store. Versioned fixed request/digest, random idempotency key, user ownership, active key and known session ID; existing pending/completed states. No new model/table. |
| Existing `BillingCustomer` and paid-access modules | Reused customer/selected-subscription uniqueness, cache and terminal veto. Association supplies the trusted binding; it grants no playback. `paid-access.js` and `paid-period.js` are unchanged. |
| `identity/service.js`, existing controllers/routers | Shared registration validation extracted without changing legacy registration semantics. Existing proof/session/CSRF/ownership protections and raw webhook signature verifier reused. Candidate handler/router factories are mounted only by test fixtures. Normal candidate endpoints return 404. |
| `20261101200000_owned_checkout/migration.sql` | One forward migration: nullable User.stripeId, account-level deletionRequestedAt, unique non-null Checkout session IDs on Checkout operations. No old migration edits, invented customer IDs or selection backfill. Applied only to fresh disposable schemas. |
| Frontend existing views and `src/util/purchase.ts` | Signup/Login accept an isolated account-ready composition; account/return named exports render server purchase/manage/pending/help outcomes. Shared forms, Button, API, AuthProvider and proof handling remain. Normal AppContainer/main are unchanged. |
| Shared AuthProvider | Adds a synchronous capture of its existing session revision/user. Purchase responses are discarded immediately on logout/session change, including before React commits the next render. Existing identity behavior remains; no second auth context. |
| Existing HTTP/browser/DB tools | Extended fixtures and launcher rather than creating another application/framework. Fresh PostgreSQL startup is shared between CLI and browser; startup failures clean up owned resources. No dependencies or lockfiles changed. |

New production code is needed for the app-account-before-Stripe ordering and the
cross-system purchase commit. PostgreSQL cannot commit atomically with Checkout;
a durable reservation plus the same Stripe idempotency key closes that gap.
Stripe cannot establish ownership of our cookie session, prevent stale local
association or protect media issuance. The new coordinator is 418 formatted
lines; the existing 254-line access implementation is reused. Narrow factory
seams, shared validation and the client contract account for the other additions.
Old implementation files remain intact pending their approved removal gate.

## Behavior and failure boundaries

- Register the local unprivileged account first, with no Stripe request/customer.
  Repeated/case-varied signup never overwrites identity. A transaction-scoped
  email lock serializes candidate registration; existing ambiguous legacy emails
  remain support/preflight cases. Existing mail proof exchange verifies purchase
  authority; returned customer IDs, Stripe email and success URLs do not.
- Reserve one owned active Checkout attempt per user before POSTing its immutable
  server price/quantity/card-only/mode/return URL/metadata request. Known open
  sessions resume. Unknown outcomes retry only the same key within the conservative
  23-hour window, with a non-negative age; unknown old/future-dated attempts stop
  at help. No customer-wide/account-wide discovery or generic recovery loop.
- Replace an unfinished attempt only after retrieving that exact session as expired
  and checking any referenced subscription is terminal. A newly persisted session
  ID does not make an older unknown-outcome read safe to replace. Independent-client
  and deterministic suspended-read tests cover this race.
- Signed completion and owned server retrieval use the same association function.
  Check mode/API envelope, exact attempt/metadata/customer, supported single monthly
  item, positive paid completion and exact subscription. Unsupported outcomes fail
  closed with help; provider trouble is retryable unavailable. Duplicate delivery,
  missed return and provider success/local failure converge on the retained attempt.
- Transactions recheck User and binding/deletion state, active attempt, prior
  selection and uniqueness. No completion creates/upserts a User. User row locking
  also serializes ordinary updates/deletion. Stale completion cannot replace a newer
  association or resurrect identity. Pending deletion without a customer is guarded
  on User; the old customer flag is also checked during transition.
- Legitimate replacement clears the old cache/veto atomically. Same-subscription
  completion preserves a veto. Observed cancellation of a newly selected subscription
  installs its own veto. Old-subscription cancellation and suspended old fills cannot
  populate/block the replacement. D10 still bounds notifications missed around
  association; no cancellation-history ledger was added.
- Existing ongoing selected subscriptions, including unsupported billing arrangements,
  go to management instead of a second purchase. Portal uses only the trusted customer;
  a customer-null account gets a local action without a provider call.
- Browser actions preserve credentials/CSRF, accessible busy controls, safe retry,
  abort/unmount handling and synchronous session invalidation. The candidate no longer
  waits/retries login for customer.created or infers purchase availability from display
  subscription status. Hosted URLs are validated; test-only navigation maps them to
  fake hosted pages. There is no production test switch or grant endpoint.

Local schema change needs coordinated deployment later: a generated client reading
new User columns must not run against an unmigrated existing database. No deployment
compatibility or legacy-account selection is inferred from a fresh-schema test.

## Verification

All provider resources, email and media delivery are fake. HTTP middleware,
raw-body signatures, cookie sessions, Prisma and PostgreSQL are real locally.

| Check | Result / limit |
| --- | --- |
| Full synthetic backend suite | **323 pass**: previous 290, 32 purchase cases and one normal-route isolation check. |
| Full disposable PostgreSQL suite | **183 pass**: previous 144, the same 32 purchase cases and seven new independent-client/SQL/race checks. Includes old engine, cache and migration-upgrade regression. |
| Focused React purchase browser assertions, StrictMode | **15 pass**: nullable customer/server action, repeated clicks, accessible busy state, redirect validation, retry/help, management, logout/unmount races, return retry, credentials/CSRF and authority-free bodies. Axios double; separate from the full journey. |
| Existing player React browser assertions | **23 pass**, with the existing test-only Axios/Audio doubles. |
| Existing frontend unit suite | **14 pass**. |
| TypeScript, changed-source ESLint, normal Vite build | Pass. Existing browser-data-age and >500 kB bundle warnings remain. Build output is disposable under /private/tmp. |
| Prisma validate, 162 backend JS syntax checks, new/refactored module formatting, diff whitespace | Pass. |
| Separate strict schema diagnostic | **6 pass / 1 fail** only for pre-existing NetworkError.errorCode Required→Nullable drift, unchanged and unsuppressed. No billing/User drift in the regular migration diagnostic. |

The prior-schema upgrade fixture now explicitly selects only columns existing at
that point before applying the new migrations. Its retention/mismatch assertions
remain; no historical migration or telemetry drift was changed to make it pass.

The browser-driven journey used actual fetch/cookies/HTTP/disposable PostgreSQL:
new signup → one captured email → verification → Checkout → abandon → reload →
resume same attempt → unpaid completion/return (playback denied) → signed paid
completion → explicit return refresh → independent paid playback authorization →
fake Portal → account. A second buyer verified expired-session retry and help for
an old unknown outcome, including reload without a new-purchase action. These are
observed browser interactions, not a new automated/headless E2E runner. No direct
binding seed was used. The test page checks issuance with fake media delivery; it
is not certification of real audio streaming/provider expiry.

Disposable browser captures live in the frontend's ignored `test/evidence/`:
`purchase-journey.png`, `purchase-http-metadata.json`. Metadata contains only
method/path/status/header-presence and synthetic counters; no proofs/cookies/raw
provider payloads. Versioned test source, not the captures, reproduces behavior.

## Observed Stripe request counts

These counts are asserted against fake SDK resources, not measured real Stripe
traffic or latency. GET/POST are separate; a retry is another HTTP request even
when its idempotency key produces one logical Session.

| Isolated scenario | GETs | POSTs | Outcome |
| --- | ---: | ---: | --- |
| Account creation + email verification, no purchase | 0 | 0 | No Stripe customer yet. |
| First Checkout | 0 | 1 | One persisted attempt / one logical Session. |
| Repeat/resume known open Checkout | 1 | 0 | Same session, no new purchase. |
| Eight concurrent HTTP requests, observed memory and PG runs | 7 | 1 | One logical Session/attempt; calls can vary with scheduling. Independent overlapping safe-key retries may add POSTs, never a fresh key for the same active attempt. |
| Owned paid return completion | 2 | 0 | Exact Session with expanded items + exact subscription; secure binding only. |
| Duplicate signed paid completion | 2 | 0 | Same binding; no new entitlement or session. |
| Ongoing account action summary | 1 | 0 | Exact selected subscription; management. |
| Provider success, failed Session-ID write, successful retry | 0 | 2 | Same persisted key/request and one logical Session; real SQL failure/rollback tested. |
| First eligible paid playback, including final signing check | 2 | 0 | Exact subscription + one scoped most-recent paid-invoice query. |
| Subsequent fresh paid playback | 0 | 0 | Shared cache; ownership/veto still checked. |
| Old unknown outcome | 0 | 0 | Help, reservation retained. |
| Portal creation for owned customer | 0 | 1 | Hosted management only. |

No customer creation API, customer/subscription/session/schedule history listing,
PI/Charge/refund/dispute read or financial grant/event-history write is needed by
the new journey. The access adapter's scoped paid-invoice query is retained.

## Reproduce and boundaries

Use the existing pinned Node 24.19.0, Stripe 17.5.0/Acacia and Prisma 4.12.0.
Generate the local Prisma client after the schema change. From the backend:

```sh
node --test test/*.test.js
EMBEDDED_POSTGRES_MODULE=/absolute/path/to/embedded-postgres/dist/index.js npm run test:billing:local
# Smaller DB subset: identity + purchase
EMBEDDED_POSTGRES_MODULE=/absolute/path/to/embedded-postgres/dist/index.js npm run test:purchase:local
# Separate diagnostic intentionally retains the known failure
EMBEDDED_POSTGRES_MODULE=/absolute/path/to/embedded-postgres/dist/index.js npm run assess:schema:local
```

The optional local PG tool is not an application dependency. It creates a new
loopback cluster with generated credentials and stops/removes it afterward. No
DATABASE_URL from an existing app environment is consumed by that launcher.
`test:purchase:db` is guarded for the explicit dedicated disposable test database.

From the frontend, with the same optional module configured and compatible Node:

```sh
node test/browser-harness.mjs --purchase
```

Open `http://127.0.0.1:3000/signup`; use captured mail and fake hosted controls.
`/test/purchase-ui-browser.html` runs the 15 focused checks;
`/test/playback-browser.html` runs the 23 existing checks. The launcher uses the
sibling backend or explicit RVDL_TEST_BACKEND_ROOT and synthetic frontend config,
with temporary environment directory and loopback ports 3000/8090/8091. No normal
entry mounts the fixture routes, control/mail endpoints or test browser tree.
Stop the launcher to discard its disposable database. Default launcher mode still
serves the old identity fixture; the candidate mode is explicit test composition.

Source fingerprints taken before implementation confirm that normal backend
`app.js`, billing runtime/old engine, paid-access modules, playback runtime/service,
existing migrations, frontend `main.tsx`/`AppContainer.tsx` and both lockfiles were
preserved. Shared controller factories, validation, nullable identity type and
session capture were intentionally extended; this is not a claim all source files
are unchanged. The normal-route 404 test plus legacy regression cover the gate.

## Exact remaining work and removal

1. **D9 local controls are implemented above.** Owner support destination and real
   provider verification remain activation dependencies; unknown legacy outcomes
   remain explicit investigation blockers.
2. **C1 local cutover/removal, separately authorized, estimated 3–5h after D9:**
   select purchase/deletion/access factories in the existing normal runtime/routes
   and candidate frontend wrappers (including the protected owner route); compose
   the staged Resend deletion adapter with an owner-supplied support destination.
   Apply required forward migrations only under separate existing-DB authorization;
   generated clients must not read new columns before that migration. Remove the
   temporary legacy branches and old provisioning/recovery before exposing D9. Delete old
   `billing/service.js`, `operations.js`, `reader.js`, `reconcile.js`, reconciliation
   CLI/command; prune `evidence.js` to actual small shared helpers. Remove obsolete
   payment-method/resubscribe/creation GET/receipt-log APIs and duplicate ownership.
   Prepare/test forward removal of PaidInvoiceGrant, old historical Subscription,
   StripeEventReceipt, CheckoutOwnership and synchronization/admission columns;
   retain attempt, binding/cache and necessary deletion/tombstone facts. Preserve
   migration history and resolve existing-data/retention blockers explicitly. Port
   security scenarios, remove superseded-policy-only tests and rewrite current
   operations instructions. Completion means one normal path, not parallel engines.
3. **Actual Stripe configuration/verification, separately authorized, estimated
   2–4h:** pinned request/event/expansion shapes, card-only positive purchase,
   customer creation, same-key recovery and webhook/return ordering; owner-reviewed
   Checkout/Portal/recovery/dispute settings. Local fakes are not evidence for these.
   Existing-account/attempt/case-duplicate inventory and migration preflight remain
   activation dependencies, not permission to query a remote DB now.
4. **Delivery/launch gates:** real private-media mapping/signing, public-URL
   retirement, expiry/streaming/player integration, deployment and restoration
   remain outside this slice and are not included in those billing estimates.

Remaining billing transition planning is now **5–9 active engineer hours** for
C1 + provider verification, excluding completed slices and deployment/delivery
work. Owner participation is separately about 1–2.5h for walkthrough/checklists/
settings. The authorized 7–10h for this slice was a planning estimate; engineer
labor was not clocked, and test/tool/browser waiting is not continuous engineer
work. Latest full synthetic/DB suite bodies took about 1.4s/6.4s respectively,
excluding startup and review; build took about 3.7s. No scope expansion was needed.

Expected maintenance reduction occurs at C1, not from the temporary added code:
remove daily reconciliation, financial-history/grant repair, generic operation
scans, customer-event provisioning and client billing policy. A final billing
layer around half the prior 1,684 lines remains a design check, not a line quota
or measured labor saving. Stripe owns recurring billing/recovery/management;
we retain identity, one owned purchase commit, current selection/cache and playback.
Owner handles approved Dashboard exceptions and deletion completion; difficult
unknown outcomes or provider changes can still need engineering. The zero-routine-
engineering / roughly five-hours-per-quarter objective is not yet operationally
validated, and cannot be claimed while the old normal composition remains active.
