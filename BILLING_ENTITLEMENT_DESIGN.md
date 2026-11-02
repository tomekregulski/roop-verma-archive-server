# Owner direction superseding the implementation approach — 2026-11-01

Assessment complete for review: [STRIPE_LED_ASSESSMENT.md](STRIPE_LED_ASSESSMENT.md).
It contains the original D1–D10 decision table, adjacent-work audit and operating
duties. D1–D10 are subsequently approved in `STRIPE_LED_DECISIONS.md`.
`STRIPE_LED_D10_RECOMMENDATION.md` supersedes the direct-check recommendation and
transition estimate. Only the isolated local access slice is authorized/implemented;
see `PAID_ACCESS_IMPLEMENTATION.md`. Normal-runtime cutover remains unauthorized.

Minimize the application's billing layer to fit the very limited maintenance
budget. Prefer Stripe-hosted Checkout for purchases/subscription signup, Customer
Portal for billing management, and Stripe-managed lifecycle behavior. Retain the
application's necessary verified identity, trusted customer binding and playback
enforcement. Additional custom automation needs a concrete justification against
Stripe capabilities and a documented operator workflow.

The design and local implementation below remain useful evidence, but their
custom invoice-grant/recovery architecture is under reassessment. The readability
pass did not settle this concern. Review registration/provisioning too. Existing
access-policy cases should evaluate alternatives; any change to their promised
behavior must be stated explicitly. No application behavior, schema, provider
configuration or other branch is changed by this direction note.

---

# Implementation status — 2026-11-01

The approved local implementation in [BILLING_API.md](BILLING_API.md) is complete,
including the owner's subsequent simplification/readability request.
Use [test/README.md](test/README.md) for verified results and evidence limits,
[Operations.md](Operations.md) for repair, and [BACKEND_BASELINE.md](BACKEND_BASELINE.md)
for the handoff. The original checkpoint below retains its historical design-only
approval record; the later implementation request superseded those local limits.
Real Stripe validation, protected delivery, legacy URL retirement, deployed behavior
and restoration remain separate. No real provider/remote database actions were taken.

---

# Historical Stripe payment to playback entitlement design checkpoint, 2026-11-01

Status: **owner-approved design checkpoint**, 2026-11-01. The entitlement model,
initial feature scope and first implementation task are agreed. Approval is for
design only; implementation and provider actions are not authorized. No
application, dependency, schema or migration changes.
Service restoration remains deferred. This does not establish billing correctness,
private-media protection or deployed behavior. The existing
[playback contract](PLAYBACK_API.md) still describes the implemented application.

Reviewed backend `cfa53f5387a94177b877547a1806836d84a639cd` and frontend
`eb793c0668425882ecf71f7d79cf643b2174f758`, both initially clean. Read backend
`AGENTS.md`, current backend/frontend identity and playback handoffs, identity and
playback contracts, all 25 Prisma migrations, schema, billing/identity/playback
handlers and relevant fixtures/tests. No frontend or enclosing-workspace
`AGENTS.md` was found. Official public Stripe documentation was read; no Stripe
API, account, customer, database or media service was accessed. Tests and
migrations were not run in this documentation-only assessment. Earlier test
results below are historical evidence, not a new verification run.

## 1. Current flow and confirmed gaps

```text
Signup -> POST /user -> Stripe customer creation -> customer.created webhook
       -> local User -> mailbox verification -> persisted identity session
       -> owned Checkout creation -> Stripe subscription/payment
       -> subscription webhooks -> local status strings only
       -> Checkout return -> owned lookup/session refresh, no payment confirmation

Playback -> public Track: no identity/entitlement required
         -> subscriber Track: current identity + normalized paid interval required
         -> normal entitlement/mapping/signing adapters currently unavailable
```

| Area | Code evidence and consequence |
| --- | --- |
| Registration and customer ownership | [user POST controller](controllers/user/controller.post.js), lines 7–16 validates names/email and checks for a local user, then creates a customer with no durable operation/idempotency key. It does not persist the user. [webhook controller](controllers/payments/controller.post.js), lines 53–77 creates User on `customer.created`, splits a provider name into two words, assumes non-null name/email, and swallows create failures. Repeated signup before provisioning can create duplicate customers; an unrelated Dashboard-created customer can provision a user. Email is not a safe billing association key. |
| Customer association | [schema](prisma/schema.prisma), lines 21–32: unique `User.stripeId` and email; no provisioning intent, association history or deletion tombstone. Signed events prove origin, not that a customer was created by this app or belongs to a particular verified user. `customer.updated` is ignored, so provider email changes do not change login identity. Preserve that separation. |
| Checkout and return | [payment GET controller](controllers/payments/controller.get.js), lines 10–62: two equivalent subscription creation paths use the authenticated customer's ID and one hard-coded price, with quantity one. They lack a pending-session/ongoing-subscription check and Stripe idempotency key. Stripe creation precedes `CheckoutOwnership.create`: DB failure leaves an external session, and retry can create another. [ownership middleware](identity/http.js), lines 19–38 protects customer, Checkout and subscription operations. [return handler](controllers/payments/controller.post.js), lines 24–32 retrieves an owned session without granting access. Frontend `CompleteRegistration.tsx` correctly says the return is not payment confirmation. |
| Subscriptions | [webhook controller](controllers/payments/controller.post.js), lines 116–242: create assumes User exists and `data.plan.product` is usable, stores placeholder price/product IDs, writes Subscription and User separately; a missing customer, duplicate create or second subscription can fail. `cancel_at` is a numeric timestamp but `cancelAt` is a nullable String. Update only changes `User.subscriptionActive`, leaving Subscription stale. Delete removes the row by user, rather than by the event's subscription ID; a delayed deletion can delete a replacement subscription. Several failures are swallowed. |
| Invoices/payment evidence | No invoice processing exists. `invoice.payment_failed` is only a comment (lines 244–245); `invoice.paid` and renewals have no implementation. Neither schema nor migrations persist settlement evidence or a service interval. A successful customer/payment-method/Checkout operation establishes no paid entitlement. [payment PUT controller](controllers/payments/controller.put.js), lines 20–27 attaches a method and sets the customer's default; it does not settle an invoice or necessarily override a subscription-specific default. |
| Webhook delivery | [app.js](app.js), lines 18–22 preserves raw bytes with a 16 KiB limit; [webhook controller](controllers/payments/controller.post.js), lines 34–51 verifies signature/time before dispatch. Authenticity is locally tested. The billing switch ends in 200 even after swallowed failures; the subscription-create branch has unwrapped async failures under Express 4. No atomic application, event ledger, concurrency control or reconciliation exists. `event.request` is read but unused. `WebhookLog` has neither unique event ID nor processing state and is never written here. A Stripe request ID/idempotency key is not a webhook event identity. |
| Deletion | [user DELETE controller](controllers/user/controller.delete.js), lines 5–9 performs admin-only local deletion, with no Stripe cancellation. Migrations cascade Subscription and identity/Checkout data. External billing can continue. `customer.deleted` instead deletes the local user and swallows failure (webhook lines 82–110). A delayed `customer.created` can recreate a deleted user because no tombstone exists. Stripe customer deletion itself cancels subscriptions, but local User deletion does not call it; see [Stripe customer deletion](https://docs.stripe.com/api/customers/delete). |
| Display versus authority | Frontend `AuthContext.tsx`, lines 19–22 includes `trialing`, `active`, `incomplete` in its display policy; `ManageAccount.tsx` uses this to show Checkout. This may hide recovery actions but grants no server playback access. The display must eventually reflect synchronized billing/entitlement outcomes. |

Migration history confirms one local Subscription per user: uniqueness added in
September 2023, removed, then restored by `20231006210251_`; customer-ID uniqueness
on Subscription was removed separately. `20231015190343` introduced cascade
deletion. `20261017160000_email_identity` added identity and Checkout ownership,
not billing evidence. The separate known `NetworkError.errorCode` schema/migration
nullability drift remains unresolved; it must not be hidden by a billing change.

### What `paidAt` does and does not prove

[playback/service.js](playback/service.js), lines 7–13 accepts only a server adapter's
`{kind:'paid', userId, paidFrom:Date, paidThrough:Date, cancelled?:boolean}` and
checks `paidFrom <= now < paidThrough`. Extra fields, including `status`,
`revokedAt` or a payment timestamp named `paidAt`, fail its whitelist. Invalid
dates fail the comparisons. It does not independently verify invoices, customer
ownership, subscription lifecycle, refunds/disputes or freshness. It can accept
an arbitrarily long fabricated interval from a faulty adapter. Its name is a
predicate, not persisted evidence of payment.

The recheck at lines 48–50 checks the same in-memory interval after asset mapping;
it catches elapsed time, not a concurrent database revocation. The billing adapter
must filter revoked/ineligible records before returning the narrow shape. Once
revocations exist, reread entitlement after asynchronous mapping before signing;
test that boundary. No read/sign sequence can promise instantaneous revocation
across a concurrent commit. Existing URLs can last two hours beyond the paid
boundary; the approved contract does not cap them to paid-through or recall bytes.
Keep provider/version/audit fields in persistence, outside this adapter DTO.

Historical tests: [stripe-webhook.test.js](test/stripe-webhook.test.js) has 19
authenticity/middleware checks, not payment-lifecycle checks.
[playback-access.test.js](test/playback-access.test.js) supplies synthetic intervals
and fake signing, including exact expiry/cancellation and malformed-grant denials.
[playback-runtime.test.js](test/playback-runtime.test.js) proves normal composition
returns 503 and does not consult legacy subscription status. The handoff records
166 total synthetic tests and 23 frontend browser assertions; none proves billing.
Existing PostgreSQL tests cover identity/ownership, not this agreed design.

## 2. Stripe compatibility and authoritative evidence

`package-lock.json` locks Stripe **17.5.0** and Prisma **4.12.0**. The installed
SDK's `cjs/apiVersion.js` and `stripe.core.js:78` default outbound requests to
**2024-12-18.acacia**; all four application Stripe constructors omit an explicit
override. This agrees with [Stripe's v17.5.0 source](https://raw.githubusercontent.com/stripe/stripe-node/v17.5.0/src/apiVersion.ts).
Retain these versions; making the existing request default explicit is reasonable
in implementation but is not an upgrade. Deployed code/configuration is unknown.

The account default and webhook endpoint's configured payload version are
**unknown**. SDK version does not set the webhook payload version. Stripe documents
endpoint/account version selection in [API versioning](https://docs.stripe.com/api/versioning).
Use a versioned normalizer for retrieved Acacia resources, not current-version
examples that use different invoice/payment relationships. Read signed event
envelope IDs/type/mode/version as routing hints, then retrieve current objects
with the existing request version. Validate supported snapshot envelope shapes;
record `event.api_version`. Unsupported/missing version or thin/malformed envelopes
are durable exceptions with no grant until compatibility is established. The
first tests may use synthetic Acacia snapshot events; they establish no deployed
endpoint compatibility. Do not change the remote version to make tests pass.

**Agreed settlement rule, subject to the narrow exclusions below:** a grant
requires a retrieved, finalized subscription invoice with `status='paid'`,
`paid=true`, positive total/amount paid, zero amount remaining, a valid
`status_transitions.paid_at`, and `paid_out_of_band=false`. Require the expected
customer/subscription and expected environment. These invoice fields are documented
in the [Acacia invoice reference](https://docs.stripe.com/api/invoices/object?api-version=2024-12-18.acacia).
`invoice.paid` also fires for manually marked out-of-band payment; event names
alone cannot establish settlement. `invoice.payment_succeeded` can be another
trigger into the same reader, never a second grant path; see
[Stripe event types](https://docs.stripe.com/api/events/types?api-version=2024-12-18.acacia).

For this first paid tier, require an invoice-associated successful PaymentIntent
and captured successful Charge, with matching invoice/customer/currency and
sufficient received/captured amounts to settle the invoice. Reject pending,
requires-action, uncaptured and foreign payments. Read current refund/dispute
state as well. The association fields and financial state are available in
[Acacia PaymentIntent](https://docs.stripe.com/api/payment_intents/object?api-version=2024-12-18.acacia)
and [Charge](https://docs.stripe.com/api/charges/object?api-version=2024-12-18.acacia)
resources. This is a deliberately narrow app rule: balance-credit-only, mixed
credit, out-of-band, free/coupon-only and unusual/manual settlement do not
silently become grants. The owner approved an initial scope excluding credits,
discounts, trials, plan changes and other unsupported billing arrangements.
Prepaid credits, mixed settlement and discounted positive payments therefore
require a new explicit decision before support; they are not unresolved choices
within this first task. Keep credits/discount configuration out of the initial
offering and send exceptions to review. Do not implement a general Stripe
accounting engine.

Use **the qualifying recurring invoice line's service period**, never receipt
time plus a month, event creation time, invoice `period_end`, or a subscription's
latest `current_period_end`. Require exactly one non-proration subscription line,
quantity one, the server-allowlisted monthly price/product and expected currency;
support `subscription_create` and `subscription_cycle` only initially. Fetch all
line pages before deciding; discounts, credits, additional adjustments, ambiguous
lines, manual invoices, schedules and plan changes go to review without extending
access.
The [Acacia invoice-line reference](https://docs.stripe.com/api/invoice-line-item/object?api-version=2024-12-18.acacia)
defines line period/proration/price relationships. Interpret the returned end as
the app's exclusive access boundary, with **no added second**; that half-open
normalization is an app decision and must receive a real renewal-boundary check.

Persist `serviceFrom`, `serviceThrough`, and `settledAt` separately. The normalized
access interval is `[max(serviceFrom, settledAt), serviceThrough)`. Late recovery
can restore the remainder of the original period; paying an old invoice after its
service end grants no current time. Preserve individual intervals: taking the
minimum start and maximum end across invoices can incorrectly bridge unpaid gaps.
Never infer payment from subscription `active`, a redirect, a method attachment
or a browser-supplied customer/status/date/price. Current Stripe guidance also
warns that `active` need not mean all invoices are settled; see
[subscription webhooks](https://docs.stripe.com/billing/subscriptions/webhooks).

## 3. Policy checkpoint and event/access table

Owner-approved base policy: public tracks for everyone; subscriber tracks require
verified login plus current paid entitlement; cancellation preserves the paid
period; incomplete/unpaid subscriptions grant nothing.

Additional owner answers on 2026-11-01:

- Trials and zero-cost invoices grant nothing; no grace after paid expiry.
- A full refund or open/lost dispute revokes the affected paid period. Partial
  refunds are flagged for manual review.
- Immediate cancellation also preserves any already-paid period.
- Permit one ongoing subscription. Prevent a second through the app; preserve
  established legitimate access if an unexpected duplicate appears, flag it for
  manual resolution, and never stack paid time.
- Block account deletion until Stripe confirms all subscriptions have ended and
  no future billing remains. Keep the account available while closure is pending.
- During partial-refund review, preserve access through the original paid end
  unless a full refund or open/lost dispute independently disqualifies the period.
- After a won/withdrawn dispute, a fresh Stripe payment/refund check restores only
  the original unexpired interval, with no added time. Other invalidations remain
  effective; a stale paid event cannot clear a hold.
- Approve this invoice-backed entitlement model and first-task plan as the design
  checkpoint only, with the initial feature exclusions stated above. No
  implementation, migrations or provider/deployment actions are authorized.

No entitlement-policy decisions remain open for the agreed initial scope.
Pauses, collection pauses, gifts, credits, discounts, plan changes and admin
exceptions remain outside the initial product, with no new grants and no time
beyond already-paid coverage. Supporting them later needs a separate decision;
unknown lifecycle state fails closed pending review. Stripe environment/version
verification, migration readiness and operational launch checks remain outstanding.

The table assumes verified login for subscriber tracks. Public tracks remain
independent of billing and invalid cookies. “Preserve” always means original,
unrevoked coverage, never adding a grace period.

| Trigger / current verified state | Grant/update | Subscriber access |
| --- | --- | --- |
| Customer provisioned, Checkout created/completed/redirected, payment processing or requires action | Association/display only | Denied without an existing qualifying interval |
| First qualifying settled invoice + eligible subscription | Insert one evidence-backed period | Granted only inside the normalized interval |
| Qualifying renewal invoice | Insert that invoice's period | Granted in its interval; future periods do not activate early |
| Duplicate event or another event for same invoice | Upsert same evidence; no arithmetic extension | Unchanged |
| Cancel at end or immediately, including `subscription.deleted` | Keep paid evidence; record cancellation, never delete by user | Preserve through exclusive paid end (approved) |
| Renewal payment failed / action required; `past_due` | No new paid period | Preserve an unexpired paid period; deny exactly at expiry, no grace |
| Current subscription `incomplete`, `incomplete_expired` or `unpaid` | Record lifecycle veto; status never creates a grant | Denied for that subscription, even if a contradictory local grant exists |
| Retry succeeds and current lifecycle becomes eligible | Re-read invoice/payment and original line period | Restore only remaining paid coverage; no new month from recovery date |
| Old failure arrives after recovery | Retrieve current invoice/subscription; do not apply stale payload | Preserve current valid state |
| Trial or zero-cost invoice | Record nonqualifying outcome, no grant | Denied unless separate previously-paid coverage legitimately remains |
| Full refund, open/lost dispute | Invalidate affected grant from discovery; preserve audit evidence | Deny that interval; another independently valid period is unaffected |
| Partial refund | Durable review item | Preserve original remaining period unless independently disqualified (approved) |
| Dispute won/withdrawn | Fresh Stripe payment/refund verification and resolution | Restore only original unexpired interval if otherwise qualifying; never add time (approved) |
| Unrecognized price/mode, foreign mapping, unsupported billing change | Durable exception; do not overwrite established grants | No new access; mapping corruption makes authority unavailable |
| Unexpected second ongoing subscription | Quarantine newcomer, flag duplicate, no stacking (approved) | Preserve already-established legitimate coverage |
| Account deletion requested while billing remains open or cannot be verified | Block deletion; keep identity/account and billing history available (approved) | Existing paid-access rules continue while closure is pending |
| Local user deleted | Identity/session invalid; retained billing association becomes tombstone | Denied; events must never recreate identity |
| Stripe customer deleted | Record terminal customer state; do not automatically delete login account | Preserve paid period under cancellation policy unless local account deleted; no future billing/grants |
| DB/reader unavailable | No fabricated fallback | 503; known absent/expired/ineligible entitlement is 403 |

For `past_due`, preserving genuinely paid, unexpired coverage is the agreed
interpretation of “no grace”; settling a different old invoice does not pay an
unpaid current period. `paused` is distinct from `pause_collection`, which can
leave Stripe status unchanged; see [Acacia Subscription](https://docs.stripe.com/api/subscriptions/object?api-version=2024-12-18.acacia).
Do not enable pauses in the app/portal until their access behavior is decided.

## 4. Minimal local data model and ownership

Prefer three small new tables plus adapting the existing Subscription into a
history, rather than an overwrite-only `User.paidThrough` cache or a new queue.
These are design-level fields, not a migration file.

| Record | Proposed fields / constraints / owner |
| --- | --- |
| `BillingCustomer` (new) | Stripe `customerId` primary key, unique nullable `userId` FK with `ON DELETE SET NULL`, `livemode`, `revision` integer, `deletionRequestedAt`, `deletedAt` (local-account tombstone), `stripeDeletedAt`, `lastSyncedAt`, bounded `syncIssueCode`. App owns immutable association and deletion state; Stripe owns customer existence/mode. Survives local deletion; never rebind by email. `User.stripeId` remains compatibility data and must match the binding. |
| `Subscription` (adapt existing) | Keep globally unique Stripe `id`; relate existing `stripeId` to BillingCustomer. Retain every historical subscription. Remove `userId` uniqueness; make legacy user relation nullable with `SET NULL`, change User relation to a list. It is compatibility data, not the authoritative association. Add `acceptedAt` (app admission for the one-tier subscription), `livemode`, `cancelAtPeriodEnd`, typed nullable cancellation/end timestamps and `syncedAt`. Existing status/real price/product are refreshed from Stripe; no placeholders. `acceptedAt` never follows client metadata. Old `cancelAt` String is display-only until replaced. |
| `PaidInvoiceGrant` (new) | `invoiceId` primary key (one supported recurring line/invoice), `invoiceLineId` unique, Subscription FK, `priceId`, `serviceFrom`, `serviceThrough`, `settledAt`, `paymentIntentId`, `chargeId`, `currency`, integer `amountPaid`, `invalidatedAt`, bounded `invalidationReason`, `reviewReason`, `verifiedAt`. Stripe owns financial/service facts; app owns qualification/review outcome. Customer/user resolve through Subscription -> BillingCustomer; no independent owner field to drift. Keep invalidated rows. |
| `StripeEventReceipt` (new) | `eventId` primary key, `type`, `objectId`, `apiVersion`, `livemode`, `eventCreatedAt`, `receivedAt`, `outcome` (`pending`, `applied`, `ignored`, `review`), `appliedAt`, `attempts`, bounded `errorCode`, `lastAttemptAt`. App owns durable processing state; timestamps are audit facts, not resource ordering. No full payload, email, payment details, secret, signature or provider error body. |

Index grants by `(subscriptionId, serviceThrough)`, receipts by
`(outcome, receivedAt)`, subscriptions by customer/status. Add database CHECKs for
nonempty IDs, valid period (`serviceThrough > serviceFrom`), positive paid amount,
and supported outcome values where Prisma 4 cannot express the checks. Use UTC
timestamps consistently. Reject invalid/future settlement timestamps; a fully
expired late payment may be retained as evidence but cannot qualify now.

`readEntitlement(userId)` performs one consistent local read of the binding,
accepted subscriptions and uninvalidated qualifying periods, applying lifecycle
vetoes and review policy. It returns only a containing paid interval (choose the
greatest end among legitimate containing intervals), never spans a gap and never
adds together overlapping periods. `cancelled` is optional metadata; cancellation
does not truncate evidence. Null means known denial; inconsistent ownership or
storage failure throws. No Stripe network call on playback. The second read near
signing handles a revocation committed while asset mapping awaited; it must not
reuse a cached grant. Private delivery adapters remain a separate prerequisite.

### Approved single-subscription and deletion behavior

Checkout admission uses the customer revision and a durable pending-operation
reservation, not a browser status check. Reuse an owned unfinished Checkout;
refuse another while any ongoing subscription or unresolved creation exists.
An expired reservation alone does not prove that Stripe failed: verify its
external outcome before releasing it. Retain canceled subscription history for
resubscription. A duplicate discovered outside the app is a review item; do not
automatically cancel, refund, replace the established subscription or add its
duration. Existing legitimate coverage remains available. Overlapping paid
periods never accumulate extra time.

For deletion, mark a pending request under the same customer revision and prevent
new app Checkout/subscription creation while it is pending. Preserve login and
existing paid access so the user can manage billing. Require a fresh, complete
Stripe check of **all** subscriptions, including unexpected duplicates, before
deletion: every subscription ended, no future schedule/pending Checkout capable
of creating billing, and no draft/open collectible invoice or scheduled payment
retry remaining. Missing pages, Stripe errors or uncertain closure block deletion;
they are not proof of no billing. Resolve outstanding billing through the approved
provider workflow; this policy does not authorize automatic cancellation, refunds,
forgiving debt or destructive customer deletion.

After confirmed closure, conditionally commit local User deletion, identity
revocation/cascade and a retained billing tombstone under revision control. The
explicit deletion ends account access even if an already-paid interval remains.
External Dashboard/API changes cannot share the local transaction; subsequent
unexpected billing on a tombstone is an operational exception to reconcile,
never a reason to recreate identity. Cancellation at period end therefore leaves
the account available until the subscription actually ends. Immediate cancellation
may permit earlier deletion once all other billing is closed. The existing admin
DELETE handler does **not** enforce any of this yet.

### Migration and existing-data considerations

- Add empty evidence/receipt tables and nullable synchronization fields first.
  Existing `active`, price placeholders and `cancelAt` strings backfill **no grants**.
  Bind existing User/customer pairs only after consistency checks; refresh real
  subscription metadata before treating a row as accepted. Old records stay
  unverified until reconciliation obtains actual invoice evidence.
- Removing user uniqueness is needed for canceled-then-resubscribed history,
  even if only one subscription may be ongoing. Update `subscriptionOwner`
  (`identity/http.js:33–38`) to find by supplied subscription ID and trusted
  customer binding, rather than `findUnique(userId)`. Review account lookup and
  session display projections so historical rows do not pick a random status.
- Preserve billing history across deletion. Backfill valid Binding parents
  before adding the Subscription/customer FK; orphan/duplicate/mismatched rows
  require an explicit repair report, never email-based guessing. No automatic
  destructive cleanup or assumed production backfill is authorized.
- Rehearse full history plus proposed additive migration on disposable PostgreSQL,
  including representative legacy fixtures and a second idempotent deploy.
  Retain the separate failing whole-schema diagnostic for NetworkError; record
  pre-existing drift distinctly from any new billing drift. Never edit applied
  historical migrations to hide it. `HEROKU_POSTGRESQL_BROWN_URL` is a shadow DB
  hazard; inspect no actual values here and use only explicit disposable URLs.

## 5. Processing, ordering, transactions and failure recovery

Use synchronous bounded processing in the existing Express service, with one
shared synchronization service used by webhooks and a reconciliation CLI. At this
scale a database receipt is enough; no Redis, broker, worker fleet or new hosting
service. This deliberately differs from Stripe's general asynchronous-processing
recommendation: bounded resource reads must finish promptly, otherwise return a
retryable failure. Revisit a worker only if measured workload makes this untenable.

The focused trigger set is `invoice.paid`, `invoice.payment_failed`,
`invoice.payment_action_required`, `customer.subscription.created/updated/deleted`,
`charge.refunded` and `charge.dispute.created/updated/closed`, plus the existing
customer association/deletion events. Dispute and refund notifications resolve
Charge -> Invoice -> Subscription -> trusted customer binding with the same
versioned reader. Add `invoice.payment_succeeded` only as an optional equivalent
notification, not a requirement. Checkout completion/async-success may prompt
reconciliation later; neither directly grants. No wildcard feature expansion or
remote event-subscription change is part of this plan. Validate this event set
against the configured endpoint during authorized test-mode verification.

1. Preserve existing raw-body/signature verification. Validate event ID/type,
   object ID, environment and supported envelope version before resource work.
   Receipt insertion is a small independent transaction. A receipt's existence
   alone is never “processed.” Completed duplicates return 200; pending/review
   duplicates retry or report the existing durable review outcome.
2. Obtain the local BillingCustomer and read its `revision` **before** Stripe
   retrieval. An invoice event can retrieve its invoice first to discover customer
   ID, but reread the authoritative resource set after acquiring the revision.
   Retrieve the current invoice, all lines, subscription, payment and relevant
   refund/dispute state. Treat event payloads as notifications, not mutable truth.
   Missing customer provisioning does not become a new user: leave a pending
   dependency for retry/repair. Customer creation/deletion uses the same binding
   serialization and checks tombstones.
3. In a short DB transaction, conditionally update BillingCustomer where
   `(customerId, revision=observedRevision)` and increment revision. On success,
   upsert the exact Subscription by ID, validate immutable association/approved
   tier, insert/update invoice evidence, apply invalidations, update compatibility
   display fields and mark the receipt applied **in the same transaction**. Lock
   order is customer -> subscription -> invoice -> receipt. Every path that
   changes billing authority, including deletion, review resolution and
   reconciliation, must obey this protocol.
4. Zero rows from the conditional update means another writer won: roll back,
   refetch current Stripe resources and retry a small bounded number of times.
   Do not reuse the pre-conflict response. Handle unique-invoice/event races and
   PostgreSQL serialization/deadlock errors the same way. No Stripe network calls
   while holding a DB transaction/lock. Two pending receipt processors may race;
   only a successful transaction applies authority, and the loser sees completion.
5. Return 200 only after applied/ignored/review outcome is durably committed.
   Failed receipt persistence, Stripe timeout/rate limit/5xx, incomplete paging,
   pending association, DB rollback or exhausted concurrency retry returns a
   generic 5xx through the async wrapper. No swallowed billing exception. A
   deterministic unsupported billing arrangement or mapping conflict becomes a
   durable `review` item with a sanitized alert/count, no grant, and 200; this is
   accepted responsibility for manual/reconciliation recovery, not success.
   Irrelevant event types receive a durable ignored outcome. Missing/invalid
   signatures retain current 400; absent signing configuration retains 503.

This defeats local stale-write races: if a delayed handler fetched before a newer
commit, its revision fails; an old event delivered later retrieves current state.
Never sort by event `created` or event ID, nor permanently deduplicate by only
`(type, objectId)`—later updates to that object are meaningful. Invoice identity
provides business-level deduplication across distinct events. Preserve a terminal
refund/lost-dispute invalidation; a payment replay cannot clear it. A dispute hold
can only be cleared after verified won/withdrawn resolution under the approved
rule, with fresh payment/refund evidence and all other invalidations respected.
Stripe documents unordered delivery, same-second events, duplicates, live retries
up to three days, and shorter sandbox retries in [webhook delivery guidance](https://docs.stripe.com/webhooks).

Stripe does not provide one atomic snapshot across all retrieved resources.
Validate cross-object consistency; retry contradictory reads. An external change
after the final read can remain temporarily unseen until its event/reconciliation.
This design is eventually synchronized and time-bounded by paid expiry, not an
instantaneous distributed revocation guarantee. A failed renewal never extends
the last verified paid end. Do not erase valid evidence just because a network
read failed or a partial list omitted an invoice.

Crash before apply leaves pending receipt/no grant; after apply but before HTTP
ack, delivery retries find applied state. A receipt outage does not acknowledge.
If Stripe payment succeeds but local persistence fails, retry/reconciliation
re-reads that invoice and inserts the same period; never charge again to repair
entitlement. A customer/subscription event arriving before the customer-provision
event likewise needs recovery, not dependence on event order.

For registration/Checkout writes, a separate small durable `BillingOperation`
record is justified in the later provisioning phase: server operation UUID,
kind/owner, fixed-parameter digest, state and returned Stripe object ID. Persist
before the provider POST, retry the same operation/idempotency key, then persist
association/Checkout ownership before returning. Reuse a pending operation across
concurrent attempts; after its retry window, resolve the external outcome before
creating anything new. Stripe keys can be pruned after at least 24 hours, so they
are not permanent deduplication; see [idempotent requests](https://docs.stripe.com/api/idempotent_requests).
Recover by recorded operation metadata and current provider resources; do not
retry indefinitely with new keys. Store/recover a local registration intent so
only app-created customers provision identity. Same-email conflicts require review,
not customer reassignment. Checkout completion remains a trigger, never proof.

## 6. Practical reconciliation

Implement an explicit operator CLI using the same reader/normalizer/transaction
service: inspect-only default, explicit apply mode, bounded batches, resumable
customer cursor and sanitized counts/issue codes. Keep it offline against fixtures
first. Real Stripe use needs separate authorization; do not add a public repair
endpoint. The caller supplies no entitlement facts.

For each known binding, list all subscriptions including canceled history and
paginate invoices; recheck relevant paid periods and their current payment,
refund/dispute state. For initial recovery scan the customer's complete invoice
history in resumable batches; for routine runs scan all nonexpired/future grants,
unsettled invoices, pending/review receipts and invoices since the last successful
scan with overlap. A full scan is the escape hatch for long outages, old paid
invoices and customer inconsistencies. Advance a cursor only after a complete
batch; partial API pages/timeouts never establish absence or revoke grants.

Replay receipts missing dependencies; discover invoices whose events never arrived;
repair local paid evidence/status from authoritative resources. Reconciliation
must bypass “event already applied” short-circuiting and still share revision
control with webhooks. Report unknown/unbound customers and duplicates for review;
never attach by matching email. Later provisioning-operation recovery can discover
customers/sessions created before local persistence. Tombstoned customers remain
eligible for billing-closure checks, never login recreation.

Start with a manual command before/after separately authorized test sessions.
Before subscriber launch, arrange one daily invocation using the existing hosting
scheduler/process facility if available, plus an on-demand customer repair. No new
scheduler or automation is created here. Monitor oldest pending receipt, review
count, last successful full reconciliation, and failures without logging customer
data. Daily repair implies up to a day of missed-event lag; normal events are the
prompt path. Expiry denies locally even during an outage; a missed renewal can
temporarily deny a paying customer until retry/repair. Owner must accept this
operational bound before launch. Stripe event retrieval has a limited retention
window; [undelivered-event recovery](https://docs.stripe.com/events/manage-webhook-endpoints#process-undelivered-events)
documents 30 days, so resource reconciliation cannot rely on event replay alone.

## 7. Test matrix and evidence tiers

`S` = synthetic Stripe resources/events with real offline SDK signatures and the
actual Express stack; `P` = disposable loopback PostgreSQL + locked Prisma and fake
Stripe; `T` = later, explicitly authorized Stripe test-mode verification. No
existing/remote DB is a test substitute. Do not load `.env` or live credentials
into synthetic suites. Use pinned Node 24.19.0.

| Scenario | Required assertions | Tier |
| --- | --- | --- |
| Initial paid invoice | Signed event -> retrieved matching invoice/payment/line -> durable grant -> real entitlement adapter -> subscriber issuance with fake mapping/signer; public anonymous unchanged | S + P; T later |
| Renewal / future invoice | Exact half-open boundaries; each invoice once; future grant not early; no gap bridging or added seconds/months | S + P; T clock/boundary later |
| No payment | Redirect/completed Checkout, active-only status, method update, draft/open/void/uncollectible, requires-action/processing/uncaptured, trial, zero invoice cannot grant | S; T representative payment paths |
| Evidence validation | Wrong customer/subscription/price/product/currency/mode, out-of-band/credit/manual settlement, proration/multiple lines, invalid dates, truncated pagination -> no new grant, durable reason | S; P constraints |
| Cancellation | Scheduled and immediate cancellation preserve original end; deletion event for old sub cannot delete a replacement; historical period retained | S + P; T later |
| Failure/recovery | Failed renewal doesn't extend; no grace; payment at mid-period restores remainder; expired old invoice never creates current time; incomplete/unpaid veto | S + P; T failure/retry later |
| Duplicates | Same event repeated; different event IDs/types for same invoice; 200-after-commit response lost; one grant, no extra duration | S + P concurrent connections |
| Concurrency | Many simultaneous initial/renewal/refund events and reconciliation; forced older fetch finishing last; revision conflict forces fresh fetch; no stale overwrite or partial receipt completion | S barriers + P independent Prisma clients |
| Reordering | Paid before customer/subscription event, renewal before initial invoice, stale failure/update/delete after recovery/new sub, same-second events | S + P |
| Partial failure | Fail each insert/update/commit; assert rollback of receipt-applied/grant/sub/display; pending receipt recoverable; API 429/timeout/paging failures return retryable 5xx | S fault injection + P DB failures |
| Refund/dispute | Full refund and open/lost dispute invalidate only affected period; old paid replay cannot regrant; partial refund review preserves remaining coverage; verified won/withdrawn resolution restores only unexpired original coverage, with no time added and other invalidations retained | S + P; T authorized representative cases |
| Ownership/deletion | Foreign event doesn't transfer ownership; no email matching; active/duplicate sub, open invoice, pending Checkout/schedule, incomplete scan or provider failure blocks deletion; pending deletion blocks new Checkout; confirmed closure permits atomic deletion; race vs invoice commit; tombstone prevents delayed customer event recreation and retains history | S + P; T closure later |
| Duplicate subscriptions | Concurrent Checkout requests; unexpected second ongoing sub; established access preserved, no stacking/reassignment, review item retained | S + P; T later |
| Reconciliation | Missing events/old outages; restart cursor; incomplete scan; applied receipt but missing/corrupt projection; run twice and concurrently with webhook; same final authority | S + P; T missed-event exercise later |
| Playback boundary | Real local adapter filters lifecycle/revocation, exact expiry; revocation during mapping reread; storage failure 503, absent grant 403; no Stripe call on playback | S + P |
| Versions / body / secrecy | Existing signature tests retained; synthetic Acacia and unsupported-version envelopes; mode mismatch; realistic invoice payload under/over 16 KiB; no raw SDK errors/signatures/customer data in logs | S; T actual configured event format/size later |
| Migration | Full replay/redeploy, representative legacy statuses/nullability/orphans/canceled history, uniqueness/FKs/CHECKs, concurrent writes and SET NULL tombstone retention | P only |

Synthetic tests prove our decisions and orchestration against supplied resources,
not actual Stripe semantics. PostgreSQL is required for uniqueness, FK/cascade
behavior, transactions, conditional updates, competing connections and migration
readiness; in-memory serialization cannot prove those. T requires named test
environment/assets and explicit authorization for test customer/Checkout/payment
actions; include real webhook configuration/version, actual invoice/line/charge
relationships, retry/redelivery, payment recovery and reconciliation. Do not call
Stripe CLI triggers or test-mode APIs during this design task. Hosted HTTPS/session
behavior and media access/Range/expiry require separate authorized verification.

## 8. Focused implementation phases and stopping point

### First task: one settled invoice becomes one durable playback entitlement

For an **already provisioned, verified synthetic account** and the configured
single monthly tier, implement the invoice reader/qualifier, durable receipt,
customer revision, subscription history and paid-period persistence, plus the
production local `readEntitlement` adapter. Route `invoice.paid` and the existing
subscription lifecycle notifications through that shared service so legacy status
handlers cannot overwrite/delete its evidence. Preserve signature/ownership guards;
wrap async failures and return acknowledgements only as designed. Implement a
customer-scoped reconciliation command using the same path. Do not implement
registration redesign, generic pricing, trials, queues or real signing.

Acceptance is one coherent outcome: a signed qualifying synthetic initial invoice
retrieved through fake Stripe is committed in disposable PostgreSQL, the actual
adapter authorizes that user's subscriber track with a recording fake signer,
and the same invoice delivered twice/concurrently grants only its original period.
Requests without payment evidence, with a foreign identity, or outside the paid
period are denied. A forced DB failure grants nothing, returns retryable failure,
and replay or reconciliation recovers exactly once. Include renewal/failure/
cancellation and paid-boundary regression cases so
the first slice cannot regress approved access rules. Normal delivery composition
remains unavailable; wiring the real entitlement adapter does not enable private
media delivery. No test access switch or grant endpoint.

Approved refund/dispute invalidations, partial-refund interim access and verified
won/withdrawn restoration need minimal event triggers and evidence filtering in
this slice, with synthetic cases; do not ship a grant path that can replay
refunded evidence or add time on restoration. If the slice exceeds a session,
stop at passing local acceptance and document remaining cases; do not characterize
an invoice-only status patch as billing complete.

### Subsequent bounded tasks

1. Complete robust registration/customer association and Checkout operation
   persistence/idempotency/recovery, single-subscription admission and billing-aware
   deletion under the approved closure policy. Replace `customer.created` auto-provisioning and
   customer deletion's automatic login deletion with intent/tombstone-aware paths.
   Update affected identity/browser fixtures without weakening authorization.
2. Complete reconciliation's resumable whole-customer scan and operational report,
   then account display/recovery behavior, remaining approved refund/dispute cases
   and any chosen deletion workflow. Daily invocation setup is separately authorized.
3. Obtain explicit authorization for named Stripe test-mode actions and inspect
   endpoint version/event subscriptions/size, actual settlement/recovery and missed
   event behavior. Check the retained 16 KiB raw limit against genuine test payloads;
   adjust only if justified, preserving exact raw bytes and bounded parsing. Do not
   subscribe to `invoice.created` merely for granting—failed acknowledgements can
   delay finalization, as described in [subscription webhook guidance](https://docs.stripe.com/billing/subscriptions/webhooks).
4. Private MP3 mapping/signing/provider enforcement, copied/unsigned/wrong-object
   denial, WAV separation, legacy URL retirement, deployed identity/schema and
   restoration remain separate readiness work. No launch/readiness claim follows
   from synthetic or PostgreSQL billing acceptance.

Stopping point reached: the owner agreed to the evidence-backed entitlement
model, initial policy scope and concrete first task above on 2026-11-01. The
questions about partial refunds, dispute restoration, duplicate subscriptions
and billing-aware deletion are resolved in the approved rules. Unsupported
features need later decisions; version/configuration, database, provider and
deployment verification remain unperformed. This document does not authorize
implementation or any provider/deployment action. Billing correctness, live
media protection and service restoration are not established.
