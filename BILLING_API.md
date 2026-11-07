# Billing and playback: current local composition

D1–D10 in [STRIPE_LED_DECISIONS.md](STRIPE_LED_DECISIONS.md) govern policy.
C1 selects one backend/frontend path; old engine and reconciliation are removed.
Current evidence, reduction and migration blockers are in
[STRIPE_LED_PURCHASE_IMPLEMENTATION.md](STRIPE_LED_PURCHASE_IMPLEMENTATION.md).
Local verification uses fake providers; activation is not deployment approval.

## Flow and authority

1. Signup creates a minimal unprivileged app account, with no Stripe customer.
   Email proof establishes a persisted session before purchase.
2. Checkout reserves one owned immutable BillingOperation before its provider POST.
   Repeated clicks resume the known Session; uncertain outcomes retry only the
   same key/request within the conservative 23-hour window. Old/future unknown
   outcomes require help; there is no history discovery or recovery worker.
3. Signed completion and owned server lookup share association validation. Exact
   attempt, mode, customer, subscription and tier checks commit trusted selection.
   No completion creates a User; redirect, association and display state grant no access.
4. Playback validates current identity, trusted binding, selected subscription and
   intended tier/product/mode. Active and past_due allow; all other, unknown or
   malformed statuses deny. No invoice reads, settlement/amount/history checks or
   invented paid periods qualify access. Purchase completion keeps its strict
   separate supported-purchase checks.
5. Shared PostgreSQL cachedStatus evidence expires within 15 minutes measured
   before provider reads. No sliding/stale-on-error extension or paid-period cap.
   Verified cancellation installs a terminal veto; old events/fills cannot undo
   it or affect replacement. Current session and access are checked after media
   mapping immediately before signing, so logout/revocation also wins.
6. Portal uses only the trusted customer. Stripe owns recurring billing, management
   and configured payment recovery; Dashboard/support handles rare exceptions.
7. Customers contact existing Help support for app deletion. A persisted owner
   initiates one exact account after manual ownership verification and matching
   email confirmation. Pending state blocks new purchases/association while login,
   trusted Portal and ordinary access remain. Owner review/abandon/completion keeps
   exact closure checks, fresh fingerprint/attestation and transactional revocation,
   identity deletion and retained late-callback security tombstones. No notification
   mail or pending queue remains.

Refund alone does not revoke or cancel (D4/D5); immediate reported cancellation
vetoes new paid issuance (D3). Dispute-related cancellation/settings and exceptional
refunds/duplicates/compensation belong to Stripe Dashboard/support (D6–D8). There
is no refund/dispute ledger, restoration engine or stacking of subscription time.
Public catalog access remains separate from protected media authorization.

## Code map

| File | Responsibility |
| --- | --- |
| `billing/runtime.js`, `billing/compose.js` | One shared Stripe client and one access/purchase/deletion composition; provider injection only for tests |
| `controllers/payments/controller.post.js` | Raw signature/timestamp verification before dispatch; owned completion lookup |
| `billing/purchase.js` | Local signup, immutable attempts, association, server action summary and trusted Portal |
| `billing/evidence.js` | Shared date/tier/relationship helpers; purchase checks stay separate from playback status policy |
| `billing/paid-access.js` | Shared PostgreSQL cache, ownership checks and cancellation veto |
| `billing/deletion.js`, `identity/deletion-http.js` | Protected owner initiation, exact closure, abandonment and completion |
| `playback/service.js`, `playback/runtime.js` | Final authorization and delivery boundary; normal mapping/signing remain unavailable |

## Normal HTTP routes

All paths below are under `/api/v1`. `:key` is the existing public API key, never
identity or administrator authority. Authenticated browser routes require the
cookie session and `X-RVDL-CSRF: 1` with configured-origin checks, including the
account/owner GETs. The admin user list retains its existing read-only guards.

| Method / path | Contract |
| --- | --- |
| `POST /user/:key` | Validated local registration, generic 202; CSRF + registration limit |
| `GET /user/:key` | Current administrator only; minimal identity list |
| `GET /payment/account/:key` | Server-owned purchase/manage/pending/help action |
| `POST /payment/checkout/:key` | Empty body; create/resume one owned attempt |
| `POST /payment/checkout-session-object/:key` | Only sessionId; ownership checked before provider reads |
| `POST /user/create-portal-session/:key` | Empty body; trusted customer only |
| `POST /payment/webhooks` | Original raw JSON, signature, mode/version and relevant envelope checks |
| `GET /user/owner/deletions/:userId/:key` | Current administrator exact review + fingerprint |
| `POST /user/owner/deletions/:userId/:action/:key` | initiate (matching accountEmail + ownershipConfirmed=true), withdraw/abandon, exact-session or complete; validated bodies and current review/closure confirmation |

Only `checkout.session.completed` association and `customer.subscription.deleted`
veto are dispatched. Other verified notifications perform no provisioning/ledger
work. Missing/invalid signatures never reach billing/storage/provider processing.
No creation GET, resubscribe alias, payment-method API, historical-account lookup,
receipt-log API or direct administrative deletion bypass remains.

`POST /track/:trackId/listen/:key` accepts only empty JSON, with validation,
origin/CSRF, public compatibility key and the existing keyed IP limiter (120/15m).
It atomically increments Track.plays and returns 204 without listener identity,
duration/history or playback authority. Client counts the first actual `playing`
event once per selected track/account/session; counts are approximate starts.
Old `/track/track-play` and all `/network-error` CRUD are removed (404).

## Schema and activation

Retained billing tables: BillingCustomer (trusted selection/cache/veto and deletion/
security tombstones) and BillingOperation (owned attempts and closure tombstones).
Forward migration `20261102120000_c1_billing_consolidation` removes five superseded
tables and seven synchronization/display columns only after strict preconditions.
It refuses every nonempty removed table, unsupported/orphan attempts, unresolved
legacy flags and missing/inconsistent trusted selection. D9's former legacy
CheckoutOwnership closure check is therefore not silently discarded. Historical
migrations are unchanged; no selection backfill or retention disposition is supplied.

Forward migration `20261107120000_bounded_simplification` additionally refuses
any TrackPlay/NetworkError rows, then drops only empty stores and deletionNotice.
It replaces paid-period evidence with cachedStatus and invalidates derived cache;
selection/veto, pending state, authority, attempts and tombstones survive. Nonempty
legacy telemetry/diagnostics require explicit disposition before rollout. The
known NetworkError.errorCode diagnostic is superseded only on successful guarded
removal; historical b004 evidence does not test the revised target.

Use [Operations.md](Operations.md) for exact activation/preflight and owner work,
and [test/README.md](test/README.md) for reproducible verification. Node 24.19.0,
Stripe 17.5.0/2024-12-18.acacia and Prisma 4.12.0 remain the compatible baseline.
Unknown existing data, actual Stripe/mail settings/behavior, deployment and real
private-media delivery remain separate gates. New authorization can lag a missed
cancellation by up to 15 minutes, plus provider delay and existing URL lifetime
(up to two hours). Local tests establish no quarterly maintenance or launch claim.
