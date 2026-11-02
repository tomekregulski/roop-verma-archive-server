# D1/D8 signup and Checkout refactoring proposal — 2026-11-01

**Status: the owner authorized this isolated local slice; implemented.** D1–D10 remain
approved in [STRIPE_LED_DECISIONS.md](STRIPE_LED_DECISIONS.md). This document
records the approved D1/D8 boundaries and removal plan. Implementation evidence
is in [STRIPE_LED_PURCHASE_IMPLEMENTATION.md](STRIPE_LED_PURCHASE_IMPLEMENTATION.md).
Normal runtime/provider settings remain unchanged; C1 and further work remain gated.

The isolated access slice is complete; its recorded evidence is **290 synthetic
and 144 disposable PostgreSQL tests**, not new results from this assessment.
See [PAID_ACCESS_IMPLEMENTATION.md](PAID_ACCESS_IMPLEMENTATION.md).

The later bounded D9 slice was also authorized and implemented (2026-11-02).
Current evidence and its retention/configuration boundaries are in the existing
implementation handoff. Historical owner-control gates below remain scope history;
C1/runtime/provider/existing-data work is still separately authorized.

## Recommendation: reuse storage and protections, replace orchestration

Deliver one isolated browser → real local HTTP → disposable PostgreSQL journey
that creates a verified account, purchases through fake hosted Checkout, securely
selects its subscription, and reaches the existing paid-access adapter. Its
business journey must not call the fixture's `select()` helper. Keep that helper
for focused cache/race tests where explicit setup is appropriate.

The target has one purchase path, one ownership record per attempt, one current
customer/subscription binding and the existing discardable access cache. Stripe
owns billing details, payment collection, recurring billing, recovery and Portal
management. We retain account identity, purchase concurrency, secure association
and playback protection because Stripe cannot authenticate our app session or
atomically update our PostgreSQL identity/binding.

### What can be reused, replaced or undone

| Existing implementation | Proposed treatment | Reason / final disposition |
| --- | --- | --- |
| `identity/service.js`, `identity/http.js`, auth routes and mail adapter | Reuse proof delivery/consumption, cookie sessions, rate limits, CSRF/origin/admin guards and public-user projection. | A verified email session already supplies purchase authority. No second authentication or verification system. |
| Registration input validation in `controllers/user/controller.post.js` | Reuse; create the app user locally instead of calling Stripe registration. Keep current name fields and form. | Removing name fields is unnecessary UX/schema work. No customer creation, registration operation or customer-event provisioning is needed. |
| `BillingOperation` | Reuse as the sole owned Checkout-attempt store; narrow its behavior. | It already holds owner, unique active key, immutable parameters/digest, creation time, idempotency ID and external session ID. Do not add `PurchaseAttempt`, a purchase ledger or a second recovery table. |
| `billing/operations.js` | Reuse fixed-parameter hashing, reservation/idempotency patterns and relevant test scenarios; replace the orchestration with a narrow candidate module. | Current `register`, `recoverCustomer`, customer/history scans, generic `recoverPending` and automatic closure are the wrong responsibilities under approved policies. Do not import the old engine to save a few helper lines. |
| `BillingCustomer`, its uniqueness constraints, new selected-subscription/cache fields | Reuse in place. | This is the trusted binding the completed adapter consumes. No subscription mirror or new grant table. |
| `CheckoutOwnership` / `checkoutOwner` | Keep unchanged for the temporary legacy composition; candidate authorizes against its owned attempt. Remove redundant ownership storage/guard at cutover. | The old guard requires a customer already bound to the user, so it cannot authorize the initial purchase or recovery before binding. Do not weaken it globally. |
| `billing/paid-access.js`, `paid-period.js` and playback service | Reuse. | Association does not establish paid eligibility. Preserve the existing independent invoice checks and final signing check. |
| Raw webhook body/parser/signature controller, Stripe client/config pin | Reuse, with a small dispatch/composition seam. | Do not replace signature checking or introduce another webhook server. Preserve Acacia, SDK timeout and disabled automatic network retries. |
| `Signup`, `Login`, `LoginGate`, `ManageAccount`, `CompleteRegistration`, shared API/components | Reuse forms, proof handling, session state and accessible controls. Extract only purchase-specific behavior for the isolated composition. | Replace customer-provisioning waits and status-based purchase decisions; do not copy the app or build a second account UI. |
| Existing HTTP, PostgreSQL runner, browser launcher and fake provider/media | Extend. | Browser requests must reach the local HTTP/DB composition; an Axios-only double does not prove the requested journey. No new test framework or dependency. |

No blanket Git revert is safe: the old billing work is interleaved with identity
and playback protection. During the later cutover, undo superseded behavior by
targeted replacement/deletion, retaining the guards. Returning to the old
status-string/payment-method implementation would reverse security work and is
not the simplification target. Preserve applied migration history.

## Concrete boundaries for the next slice

### Backend and schema

- `controllers/user/controller.post.js`: extract reusable registration validation
  and a narrow injectable handler/service choice; stage local account creation.
  Preserve the current default composition. Return a generic accepted outcome,
  never a customer ID as identity. Repeated registration must not overwrite an
  existing account. Serialize case-insensitive email creation within the local
  transaction (for example, a transaction-scoped PostgreSQL advisory lock plus
  the existing lookup/unique constraint); do not build a new identity subsystem.
- `prisma/schema.prisma` and **one new forward migration**: make `User.stripeId`
  nullable; add an account-level nullable `deletionRequestedAt`; enforce unique
  known Checkout session IDs among Checkout attempts. Existing customer/user and
  selected-subscription uniqueness remains. No synthetic customer placeholders.
  The new deletion field is necessary because an account without a customer
  cannot carry the current `BillingCustomer.deletionRequestedAt` flag. Candidate
  purchase/association checks both during transition; the later D9 cutover moves
  that responsibility to User and removes the duplicate customer flag. No owner
  control or deletion endpoint is implemented in this slice.
- `billing/purchase.js` **(one proposed new production module)**: local account
  creation, account action, reserve/resume owned Checkout and associate completion.
  Adapt the existing hashing/reservation patterns here; no generic operation
  framework. Version the fixed attempt parameters so legacy rows cannot be
  silently interpreted as new-format purchases. Retain `BillingOperation`'s
  existing name rather than introducing a second table or renaming for aesthetics.
- Existing user/payment controller and router files: expose small factories or
  named candidate handlers as needed; default exports retain today's routing.
  The existing test-only module-injection seam selects candidate handlers/routes.
  Candidate webhook dispatch handles owned completion and delegates terminal
  cancellation to `paid-access`; it never invokes old financial synchronization.
  No environment switch, public test endpoint or alternate production app.
- `test/support/identity-http.js`, `billing-provider.js`, memory DB and
  `paid-access-http.js`: extend existing seams/fakes and compose purchase plus
  paid access. Add focused `test/purchase.test.js` and
  `test/integration/purchase.postgres.js`; extend the existing runner. Do not
  rewrite the completed cache tests or revive superseded refund/dispute policies.

New code is justified only for the changed ordering (app account before Stripe),
the cross-system purchase commit, and the small action contract. Pure helpers
may be extracted when shared; no abstract repository, event bus, job or recovery
service is warranted. A tiny bounded retry around a DB reservation/commit is
different from retrying the entire provider workflow; never copy the old global
revision retry machinery into this path.

### Candidate HTTP contract

Paths below are under `/api/v1` and mounted **only by the isolated test
composition** until separate cutover approval. Protected calls retain session,
origin/CSRF, no-store and existing public-key conventions. A public API key is
not purchase authority.

| Contract | Input / response | Boundary |
| --- | --- | --- |
| `POST /user/:key` | Existing names/email → generic `202 {accepted:true}` | Creates/recognizes a local unprivileged account only. Use existing `/auth/login`, `/auth/verify`, `/auth/session`; only verified sessions can purchase. |
| `GET /payment/account/:key` | No client customer or subscription → action summary | `purchase`, `manage`, `pending` or `help`, with stable reason and allowed next action. Read current local state/known provider IDs when needed. No Checkout/Portal creation from GET. |
| `POST /payment/checkout/:key` | Exactly `{}` → action summary, with hosted Checkout URL only when safe | Server selects price, quantity, mode, trusted customer if present, return URLs and attempt metadata. Atomically reserves/reuses one active attempt per **user**, including before a customer exists. |
| `POST /payment/checkout-session-object/:key` | `{sessionId}` → action summary, not raw Stripe payload | Client ID is a lookup hint. Require stored ownership; if the ID write was lost, recover only through that user's retained attempt/original key first. Never retrieve/adopt an arbitrary client session as authority. |
| `POST /user/create-portal-session/:key` | Exactly `{}` → validated hosted Portal URL or action summary | Only an owned existing customer can open Portal. No customer yet means purchase/pending/help, not a provider call with null. |
| `POST /payment/webhooks` | Existing verified raw event → acknowledgement | Supported completion locates the retained attempt via server-written metadata and calls the same association function as return recovery. Cancellation uses the completed adapter. Unsupported/unowned events cannot provision identity. |

`manage` describes the billing destination, **not playback permission**. A
completed association can therefore return `manage` while playback remains
denied or unavailable. `pending` exposes refresh/continue only where safe; `help`
explains that no new purchase was started and supplies a non-sensitive attempt
reference. Provider/DB outages are retryable unavailable outcomes, not permission
to release an uncertain attempt. No background polling requirement or scheduler.

### Purchase and association invariants

1. Reserve the active attempt in PostgreSQL **before** the provider POST. Store
   the exact server request, random idempotency key and expected prior selection.
   Concurrency across independent DB clients must return the same reservation.
   No transaction stays open across provider I/O.
2. An open known session is resumed. Cancel/back navigation does not expire it.
   Retry an unknown provider outcome only with the same fixed request/key inside
   the existing conservative 23-hour window. A known session can be retrieved
   after that window; an unknown old outcome becomes help, not a new key or scan.
   Stripe may prune API-v1 keys after 24 hours and retains execution failures as
   well as successes. [Stripe idempotency](https://docs.stripe.com/api/idempotent_requests).
3. Release an old reservation only after its known session is conclusively
   expired/finished and any known subscription cannot still bill. A return URL,
   local timeout or cached denial is insufficient. An existing selected ongoing
   subscription leads to management, including period-end cancellation. Check
   that exact subscription when necessary; do not enumerate customer/account
   subscription, schedule, session or invoice history. Unexpected duplicates are
   owner support under D8, not something this path automatically discovers.
4. Both completion entry points retrieve/validate the known session, its complete
   one-item configuration and exact referenced subscription. Require supported
   API/mode, attempt metadata, customer association, server price/quantity, no
   unsupported arrangement, `status=complete` and `payment_status=paid` for the
   supported regular positive purchase. Incomplete/unpaid outcomes stay pending;
   zero-cost or unsupported outcomes need help. Request card payments explicitly
   for this candidate; adding delayed payment methods is outside the local slice.
   No association by email, client customer ID or redirect flags. Checkout can
   create the customer in subscription mode when `customer` is omitted; do not
   set the payment/setup-only `customer_creation` option.
   [Checkout creation](https://docs.stripe.com/api/checkout/sessions/create?api-version=2024-12-18.acacia).
5. In one transaction, recheck the existing user, account/customer deletion
   guards, active attempt and expected prior selection; claim the unique customer
   and selected subscription, set User.stripeId, and finish association. Duplicate
   completion is a no-op only after confirming the same ownership/result. Stale
   attempts cannot replace a newer selection. Never create a user in this step;
   a deleted attempt owner or retained tombstone cannot be resurrected.
6. On a legitimate different subscription, clear all access/cache timestamps and
   the old subscription's veto atomically with selection. Preserve a veto for
   the **same** subscription. Observe current cancellation state before selecting;
   a newly selected canceled subscription must carry its own terminal veto. Test
   cancellation arriving before/during association and an old fill/event arriving
   afterward. A cancellation missed around selection is still bounded by D10's
   provider read/cache rules; do not add a cancellation-history ledger.
7. Completion provides a binding only. The existing adapter independently reads
   the subscription and qualifying paid invoice before any paid media URL.

Stripe recommends one repeat-safe fulfillment function reached from both webhook
and return; browser return alone can be missed. Our additional transaction guards
protect app identity and current selection, not a local financial ledger.
[Stripe fulfillment](https://docs.stripe.com/checkout/fulfillment.md?ui=full-page).
Keep existing signature verification and supported snapshot-envelope checks;
event duplicates/order are not a reason to add reconciliation.
[Stripe webhooks](https://docs.stripe.com/webhooks).

### Frontend staging

Change boundaries are `src/context/AuthContext.tsx` (nullable customer type),
`src/views/Signup.tsx`, `Login.tsx`, `ManageAccount.tsx`,
`CompleteRegistration.tsx`, and `src/util/handleCheckout.tsx`. Extract shared
form/view pieces and named candidate exports where necessary; normal wrappers
keep their current behavior until cutover. A single proposed
`src/util/purchase.ts` holds the typed action/request/response validation contract.
Do not create a second AuthProvider, account screen tree or generic billing store.

The candidate removes the 20/40-second login retries and copy about waiting for
`customer.created`: registration now commits the app account before login is
requested. It renders server actions instead of `allowedSubscriptionStatuses` or
resubscribe guesses, and redirects to the returned hosted URL without requiring
Stripe.js to load. Keep the existing Button/Form/Input behavior, mail-proof
scrubbing, credentials/CSRF, disabled explanations, and account refresh. Guard
against stale responses/unmount/logout and allow safe retry after a failed lookup;
the current return page's one stored promise is not a complete retry mechanism.

Extend `test/browser-harness.mjs` to explicitly select the candidate fixture and
fresh disposable PostgreSQL; add one purchase browser entry/HTML under `test/`.
Mount the shared/candidate components through a small test route composition;
do not alter `src/main.tsx` or normal `AppContainer` routing. Reuse fake mail
capture, hosted Checkout/Portal controls and fake media. Repair startup-failure
cleanup in the launcher because it will now own a temporary DB process. Existing
identity/player assertion pages remain regression tools, not proof of this new
end-to-end journey. No candidate routes, fixture controls or mail capture enter
the production entry graph.

## Verification and stopping point

Require real HTTP/signatures/cookies and PostgreSQL transactions for:

- Fresh account has no Stripe customer; unverified purchase fails; verification,
  Checkout and either completion path establish exactly one trusted binding.
  Playback remains denied without a qualifying invoice, then succeeds through
  the existing adapter with paid evidence and fake media delivery.
- Cross-account hints, parameter tampering, wrong mode/configuration and unowned
  sessions fail; no client-supplied customer or return flag establishes authority.
- Independent-client concurrent clicks reserve one attempt; provider success
  followed by DB write failure recovers the same session/key. Test webhook before
  ID persistence, both return orders, duplicates, missed return and restart.
- Open/abandoned sessions resume; expired sessions allow a new attempt only when
  safe; unknown old outcomes stop at help. Ongoing selected subscriptions manage.
- Conflicting customer ownership, stale completion, newer replacement, pending
  deletion (with and without a customer), deleted identity, same-subscription veto,
  old-subscription cancellation and suspended old cache fills cannot bypass guards.
- Actual browser journey, reload, repeated clicks, pending/refresh, abandoned
  Checkout, retry/help and stale-response/session changes. Reuse existing focus,
  accessibility and lifecycle conventions. Record which checks are automated
  assertions versus browser-driven observations; do not invent a headless runner.

Record observed **GET and POST counts separately** for first purchase, duplicate
clicks, recovery, webhook/return and cold/hot playback. Assert no discovery/list
calls outside the adapter's one scoped paid-invoice query and no repeated customer
creation. Same-key POST retries are multiple HTTP calls but one logical purchase.
Do not promise a completion GET count until the pinned session expansion shape is
tested; bounded exact-ID session/subscription reads are acceptable.

Replay existing and new migrations only in fresh disposable databases, run
relevant regression/type/lint/build checks, and retain the separate known telemetry
nullability diagnostic. Do not count obsolete-policy assertions as new-policy
evidence. Stop with an isolated, reviewable browser/HTTP/DB journey, result report
and exact remaining cutover inventory. Local fakes prove neither real Stripe
semantics/latency nor production delivery readiness.

## Dependencies and exclusions

**Authorization received:** the owner explicitly approved implementation of this
scope in both repositories, preserving normal runtime and excluding provider actions,
deployment and old-engine removal. The implementation report is the current handoff. Policies need no further decision.
Use the existing pinned compatible Node runtime, dependencies and fresh embedded
PostgreSQL tooling; loopback/database-process permission is needed for tests.
No real credentials, provider access or existing DB is a prerequisite for local
implementation. Stop and surface growth if reusable seams prove insufficient or
unrelated migration/schema problems block the slice.

**Needed before later activation:** actual Stripe test-mode confirmation of
customer creation, expanded shapes, card-only configuration, idempotency and
webhook version/delivery; approved price/Portal/recovery/dispute settings;
owner-facing D9 controls; existing-account/attempt/selection and case-duplicate
inventory, plus migration preflight. Unknown legacy records become explicit
support cases, never an invented selection/backfill. No remote inventory is
authorized now. Real private media/signing, public-URL retirement, provider expiry
and remaining player integration are independent delivery prerequisites.

**Excluded now:** normal runtime/route cutover; owner controls; old-engine/schema
removal; dependency/version upgrades; provider calls/settings; existing/remote
DBs or migrations; deployment/restoration; push/merge. No generic discovery,
history repair, financial evidence ledger, scheduled reconciliation, restoration,
new discounts/trials or delayed-method support is deferred as required architecture.

## Bounded cutover and removal task C1 — separately gated

The isolated candidate is an intermediate deliverable. **The next architecture
completion task must consolidate and remove paths, not add another engine.** C1
is one local cutover/removal task, estimated **3–5 active engineer hours** after
the candidate and separately authorized D9 controls are complete. It includes
forward removal-migration files and disposable-DB verification, not applying them
remotely or deployment. Provider verification remains an activation gate.

| C1 action | Completion criterion |
| --- | --- |
| Select purchase + paid access in `billing/runtime.js` and normal routers/controllers; select shared candidate frontend behavior in existing routes | One normal purchase/association/access composition; remove candidate exports/legacy wrappers that are no longer needed. No production feature flag selecting two engines. |
| Replace old deletion entry point with approved D9 request/completion controls | No reference to `operations.deleteAccount`; login/Portal preserved while pending, purchases blocked, completion revokes identity/sessions and leaves necessary anti-recreation ownership facts. Owner controls are a dependency, not implemented here. |
| Delete `billing/service.js`, `operations.js`, `reader.js`, `reconcile.js`, `scripts/reconcile-billing.js` and its package command | No event-driven financial reconstruction, global history recovery, duplicate classification or routine reconciliation path remains. Move only genuinely shared small helpers before deletion. |
| Prune `billing/evidence.js` in place, preserving the API pin, ID/date/check/config helpers actually used by paid-period/access/purchase | Remove PI/Charge/refund/dispute reconstruction and all-pages traversal. Do not make new code depend on the soon-removed service's revision helper. Retain/resize `budget.js` only if still used. |
| Remove obsolete payment-method update, duplicate resubscribe/GET creation routes, raw session response, receipt-log API and redundant CheckoutOwnership guard | Owned attempt is the single Checkout authority; Portal manages payment details. Preserve authentication, CSRF and webhook verification. |
| Forward schema cleanup | Remove `PaidInvoiceGrant`, old historical `Subscription`, `StripeEventReceipt`, redundant `CheckoutOwnership` and old synchronization/cursor/admission columns after dependency/preflight review. Retain narrow attempt, binding/cache, account deletion state and tombstones; narrow generic operation fields only where useful. No applied migration edits or silent record destruction/retention-policy decisions. |
| Frontend cleanup | Remove provisioning timers/copy, subscription-status action rules, old Checkout helper and test Stripe.js redirect double. Remove Elements/loadStripe bootstrap if unused; package pruning is optional mechanical cleanup. Preserve player authorization/session behavior. |
| Tests/runbooks cleanup | Keep/port identity, ownership, retry/concurrency and access security scenarios; delete tests that solely assert superseded financial policies/removed engines. One normal HTTP/browser journey passes. Remove daily reconciliation/ledger repair from current operations instructions; retain historical assessment records clearly labeled. |

C1 is not complete while dead legacy production modules or redundant authority
tables remain without a named, bounded blocker. If existing-data/retention or D9
dependencies prevent safe removal, report C1 blocked/incomplete and retain the
explicit inventory; do not call parallel paths the finished architecture. No
remote data removal can be inferred from approval of local C1 code/migrations.

## Effort and expected maintenance reduction

Estimates mean **active engineer work**: implementation, review, debugging,
test inspection and handoff. They are not model wall-clock time, unattended
execution or a claim about time already spent on the completed access slice.

| Next slice work | Active engineer time |
| --- | ---: |
| Reuse seams, local registration and minimal forward schema/guards | 1–1.5h |
| Narrow attempt reservation/recovery and transactional association | 2–3h |
| Stage shared frontend contract/components in isolated composition | 1–1.5h |
| HTTP/concurrency/DB/browser verification, review and handoff | 3–4h |
| **D1/D8 local slice total** | **7–10h** |

Owner walkthrough is about **20–30 minutes**, separate from engineering. No
owner Stripe Dashboard action is needed for this slice. Unattended local suite
and build runs add elapsed time; actual durations must be recorded, not billed as
continuous engineering. Browser interaction and inspecting failures are active
work. Material growth beyond the range must be surfaced before widening scope.

For planning, **remaining** required transition work is approximately **15–24
active engineer hours**: this slice 7–10, D9 owner controls 3–5, C1 consolidation
3–5, provider verification 2–4. Do not add known-attempt recovery twice: it is in
this slice; the D9 allocation is for request/list/completion controls and the
owner checklist, not another recovery service. Owner time across these remaining
packages is roughly 1.5–3h. These figures exclude deployment/remote migration and
unrelated delivery work. They supersede reliance on the earlier **14–23h whole
transition** estimate for remaining planning; that estimate was optimistic about
the explicit integrated journey and cleanup. The completed first slice is not
added to this remaining-work total, and its actual labor was not measured here.

The current billing directory is **1,684 lines**; old evidence, service,
operations, reader and reconciliation account for **1,374** of those. This is a
removal inventory, not a claim that all those lines disappear: preserve the small
shared helpers and replace essential purchase coordination. The completed access
modules total **254 lines**. A reasonable design check is a final billing layer
roughly half today's size, with tests allowed to be larger; report the actual
net diff at C1 rather than enforce a line quota or promise hours saved from LOC.

The substantive reduction is elimination of routine reconciliation, local paid
grant/history maintenance, refund/dispute reconstruction, generic pending-operation
scans, customer-created provisioning and frontend billing policy. Renewal,
recovery, billing changes and cancellations are handled by configured Stripe
services; our request path validates one selected subscription/current paid period.
Owner duties remain documented Dashboard exceptions, dispute notifications,
duplicate cleanup and deletion completion. Unknown outcomes, provider/API changes,
outages or association failures can still require engineering. Zero routine
engineering in most months and about five hours/quarter remains the operating
target; local code/tests cannot establish that service-level outcome yet.
