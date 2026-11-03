# D10 recommendation and revised transition estimate — 2026-11-01

Current implementation/remaining-work handoff: [STRIPE_LED_PURCHASE_IMPLEMENTATION.md](STRIPE_LED_PURCHASE_IMPLEMENTATION.md).
Both isolated slices are complete; remaining billing planning is 8–14 active engineer
hours for D9 controls, C1 consolidation/removal and real provider verification, each
separately gated. Original estimates below are historical, not additional work.

Later D1/D8 scoping: [STRIPE_LED_SIGNUP_CHECKOUT_SCOPE.md](STRIPE_LED_SIGNUP_CHECKOUT_SCOPE.md)
provides concrete reuse/removal boundaries and a revised **remaining-work**
estimate. Use that proposal for future planning rather than treating the original
14–23h whole-transition range below as remaining effort. No further implementation
is authorized by either estimate; approved D10 behavior is unchanged.

Subsequent status: **D1–D10 approved; isolated local first slice authorized and
implemented. Broader transition remains unapproved.** Evidence is in
[PAID_ACCESS_IMPLEMENTATION.md](PAID_ACCESS_IMPLEMENTATION.md).
[STRIPE_LED_DECISIONS.md](STRIPE_LED_DECISIONS.md) is authoritative. The original
recommendation below superseded the earlier assessment's blanket direct-check
recommendation and its 20–36 hour estimate; it does not reopen approved policies.

## Recommendation

Use a **15-minute maximum shared server-side cache in the existing PostgreSQL
database**, capped by the verified paid-period end, with one **terminal cancellation
marker for the selected subscription**. No stale-on-error extension, background
refresh, routine reconciliation, Redis, financial ledger or generic block engine.
The 15-minute value and its user impact are a recommendation requiring D10 approval.

This is a short-lived copy of the approved D2 decision, not a new source of paid
time. Each cache fill retrieves the current selected Stripe subscription and most
recent qualifying paid invoice. Subscription status alone still grants nothing.
Existing verified identity, trusted ownership and playback protection stay in place.

Query the most recent paid invoice as one bounded candidate, then qualify it.
An unsupported latest paid invoice is not permission to scan backwards until
something qualifies. The matching recurring line supplies the service period.

The cache avoids repeated reads during track browsing and the current two-stage
playback check, survives a process restart, and works across server instances.
The cancellation marker stops all instances using a cached positive result after
a matching cancellation notification is committed. It is unusually simple because
D3/D7 treat cancellation as terminal: a fresh paid event never clears it. Only
secure association of a **different** purchased subscription can replace it.
[Stripe cancellation semantics](https://docs.stripe.com/billing/subscriptions/cancel).

## Options

| Option | Reads / latency | Stripe outage | Revocation and stale events | Maintenance / assessment |
| --- | --- | --- | --- | --- |
| Direct Stripe reads for every issuance | Typically two GETs per evaluation; naively replacing both current reader calls costs four per issuance. Adds provider latency each time. | Every new paid issuance needs Stripe. Existing URLs and public playback are separate. | No cross-request cache delay, but no transactional snapshot across Stripe resources/signing. Old webhooks must not replace the selected binding. | Fewest cache mechanisms, but potentially excessive rolling GET volume. Not recommended as an unconditional default. |
| Short in-process cache, no local cancellation marker | Two GETs per miss; hot requests use memory plus fresh local identity/ownership checks. Restart and each instance have separate cold caches. | A particular process can use an unexpired entry; cold/expired entries fail closed. | Cancellation can remain unseen for the TTL, even if another instance receives the webhook. Missed events resolve on expiry. | Smallest cache code. Adequate for a confirmed single process and accepted TTL-only cancellation delay; weaker restart/instance behavior and read accounting. |
| Shared PostgreSQL cache, no cancellation marker | Two GETs per miss; hot reads use the DB already required for identity. Less repeated work across instances. | Fresh rows can serve through their remaining TTL; expiry still fails closed. | Cancellation is observed on refresh, at most TTL after the last positive snapshot under normal provider behavior. Cache eviction alone needs care with in-flight fills. | No new service; modest schema/conditional-write code. Simpler than full invalidation, but unnecessarily ignores a known terminal cancellation. |
| **Shared cache + selected-subscription cancellation marker** | Same cached read pattern, plus a cheap shared marker check on each evaluation. | Fresh, unblocked entries work; cold/expired entries return unavailable. A known canceled subscription remains denied even if Stripe is down. | Matching terminal notification vetoes caches immediately on subsequent checks. Missing events are bounded by TTL. Duplicate/old events cannot clear the marker or block a replacement subscription. | **Recommended.** A few current-state fields and one idempotent event handler; no financial reconstruction, ordering ledger or repair jobs. |
| Cache with generic webhook invalidation or reversible blocking | Can reduce repeated reads, but frequent events can also force extra refreshes. | Depends on offline/stale policy, which is not approved. | In-flight repopulation, old paid events, cross-instance invalidation and unblock races require generations or more state. | Defer. The approved refund/dispute policies no longer justify a general invalidation/restoration system. |

An in-process cache remains a reasonable alternative if management prioritizes
minimum storage changes and accepts its cold-cache behavior. A durable cache is
recommended because PostgreSQL is already mandatory; it adds no hosting dependency
and avoids making the design depend on an unverified single-process deployment.
No actual process topology, account limits or API latency was inspected.

## Request volume and read allocations

Stripe documents a rolling allocation averaging **500 GET requests per transaction**,
with a **10,000-read monthly minimum**. Its usual global/endpoint per-second limits
and concurrency limits are separate constraints. These are account-wide, not a
free allowance per registered app account. [Stripe limits and read allocations](https://docs.stripe.com/rate-limits).

Planning arithmetic: allowance approximately `max(10,000, 500 × T)`, where `T` is
the qualifying transaction count over the relevant period. Confirm actual account
usage/limits later; do not assume registered users equal transactions. For one
monthly charge per subscriber, 100 transactions illustrates a 50,000-read allowance.
Reserve headroom for Checkout, Portal/account requests, retries and owner tooling.

At two GETs per refresh, direct playback reads are approximately
`30 × daily paid listeners × paid URL issuances per listener × 2`.
Issuances mean track starts/retries/new URLs, **not audio chunks or Range requests**.
Public playback and an account without a selected subscription need no Stripe read.

| Illustrative use; not measured traffic | Direct: 2 reads per issuance | 15-minute cache | Comparison |
| --- | --- | --- | --- |
| 10 daily listeners, 10 starts/day spread apart; 10 monthly transactions | 6,000 reads/30 days | Up to about 6,000 if no starts share a freshness window | Fits the illustrated 10,000 minimum before other reads. |
| 100 daily listeners, 20 starts/day spread apart; 100 monthly transactions | 120,000 | Could still approach 120,000 if starts never share a window | Exceeds the illustrated 50,000 allowance. TTL is not a quota guarantee. |
| Same 100 listeners, 20 starts within one hour daily, roughly every 3 minutes | 120,000 | About 4 refreshes × 2 reads × 100 × 30 = **24,000** | Fits the illustration with useful headroom. A 5-minute TTL would need about 10 refreshes/day here: 60,000 reads. |
| Same listeners, 20 starts spread across four hours, roughly every 12 minutes | 120,000 | About 10 refreshes/day: **60,000** | Still too high for that transaction example. Need usage review, not a claim that caching always solves allocations. |

These calculations exclude concurrent expiry races, support traffic and actual SDK
retry attempts. The current two-stage playback reader becomes mostly two local
cache checks with one two-GET refresh; if mapping crosses expiry, a second refresh
is appropriate. Do not memoize expired authority merely to meet a call-count test.
Use per-process in-flight coalescing for the same selected binding; occasional
cross-process duplicate fills are acceptable. Do not add distributed refresh leases.

Before launch, count actual GETs in synthetic scenarios and review real request
volume/latency during separately authorized limited verification. Workbench exposes
API activity and method/endpoint filters. Existing logs may record aggregate cache
hit/miss/error counts without IDs or payloads; no new telemetry platform is needed.
The owner can include API usage/errors in the ordinary Dashboard review. Sustained
volume beyond the planning envelope requires a separately reviewed TTL/usage or
Stripe-limit change, not automatic offline grace or silent over-allocation.
[Workbench API activity](https://docs.stripe.com/workbench/overview).

## Exact proposed freshness, outage and revocation contract

- Cache one decision snapshot per current trusted account/customer/subscription and
  billing configuration. It contains a normalized paid interval and freshness
  timestamps, not invoices, charges, payment history, tokens or media URLs.
- Start the freshness clock **before the first provider read**, not after a slow
  response. Set `freshUntil = min(readStartedAt + 15 minutes, paidThrough)`.
  Validate the interval and current time at each use. Never slide or renew freshness
  on a cache hit, failed read, webhook, restart or owner action.
- Read current local identity/binding/deletion state on every evaluation, including
  the existing final check before signing. A cache hit never authenticates a user
  or bypasses ownership. Pending deletion blocks Checkout, not existing paid access;
  completed deletion revokes sessions/removes identity and vetoes cached access.
- On a miss/expiry, use D2's limited subscription/paid-invoice checks. Normal fill
  costs two GETs; unexpected/incomplete line shapes fail closed rather than start a
  historical scan. Keep explicit SDK timeouts and bounded request handling. Do not
  add inline retry loops for playback or miscount retries as free reads.
- A fresh, eligible snapshot can be used during Stripe trouble without another
  provider read. A cold/expired cache returns 503 on provider failure. Database or
  identity unavailability also fails closed; a Stripe cache does not cover DB outages.
  No stale-if-error grace is proposed. A known canceled/expired subscription is a
  denial, not an availability error. Fresh data cannot promise a long outage bridge.
- When a verified `customer.subscription.deleted` event matches the current selected
  subscription, customer and mode, persist its terminal cancellation marker before
  acknowledgement. Failure to persist returns retryable failure. A canceled status
  observed during a direct refresh sets the same marker. Signature verification and
  supported-envelope checks remain mandatory.
- The marker is a local **veto**, not an entitlement. Refund-only events do not set
  it under D4/D5; dispute events do not create a separate hold under D6. No invoice
  or active/updated event can clear it. A late cancellation for the old subscription
  cannot affect the new one. New association clears old snapshot/marker only in the
  owned Checkout association transaction, when the selected subscription changes.
- Cache writes are conditional on the same current binding, absence of its terminal
  marker and a non-older read-start timestamp. A newer denied result invalidates
  the snapshot; a failed provider request does not freshen it. Recheck the shared
  veto/binding at signing so a fill already in flight cannot undo cancellation or
  local deletion. No global customer revision/retry/reconciliation mechanism is
  needed for these discardable cache writes.

After Stripe makes cancellation effective, new issuance stops when the marker is
committed, or when the prior positive snapshot expires within 15 minutes if the
event is delayed/missed. If Stripe is then unavailable, expiry denies new issuance
rather than extending access. Already-issued two-hour URLs are independent: a URL
issued just before cache expiry could remain usable until roughly **2h15m after
effective cancellation** in the missed-event case. This is an upper-bound model of
our cache/URL policy, not an end-to-end provider timing guarantee. Dispute-triggered
cancellation can additionally take about an hour at Stripe under D6. No cache
duration extends new issuance past paidThrough; existing URLs can already outlive
that boundary under the unchanged media contract.

The cache normally lowers latency to local DB reads. A miss still incurs two
provider round trips; no real latency measurements exist. A 15-minute cache helps
brief disruptions only for recently active listeners. A 60-second cache would not
meaningfully cover most track-to-track outages or rolling read volume; multi-hour
stale-on-error service would require a different explicit D10 decision.

Stripe does not guarantee webhook order and can send duplicates. The terminal
marker avoids event-time ordering: old events may deny only their exact selected
subscription, never grant or unblock anything. Missed cancellation events resolve
at the next expired-cache retrieval; no sweep is required. Purchase association
still needs D1/D8's idempotent owned-session/return recovery and protection against
deleted-account recreation; this cache does not replace that separate work.
[Stripe event delivery](https://docs.stripe.com/webhooks).

## Revised transition estimate

**All engineering estimates below mean active engineer working time:** source review,
implementation, inspection of generated code, debugging, test-result review and
handoff. They are planning ranges, not a quote or a prediction of model execution
time. AI-assisted authoring can reduce typing; it does not remove engineering review.
Unattended tests, tool execution and provider wait windows are not counted as
continuous engineer labor. Calendar duration can be longer and tasks can overlap.

| Work package | Engineer working time | Owner active time | Included / dependency |
| --- | --- | --- | --- |
| **A. Necessary local implementation and tests** | **9–14h** | About 0.5h for walkthrough | D1 account-before-purchase; narrow owned Checkout association/retry; minimum schema; D2 access qualifier; proposed D10 cache/terminal marker; playback integration; minimal client contract changes; meaningful HTTP/DB/browser regression; removal of superseded live ledger/reconciliation paths and current handoffs. Requires D10 approval and later explicit backend/frontend implementation authorization. |
| **B. Owner-facing deletion/recovery controls** | **3–5h** | About 0.5–1h for usability/checklist trial | Authenticated deletion request and pending message, purchase block, protected owner list/completion action and narrow known-Checkout recovery/retry/help. Reuse current admin/session/CSRF guards and components. No arbitrary entitlement editor, SQL duty or new admin dashboard product. D9 makes this necessary before operational handoff. |
| **C. Provider configuration and real Stripe verification** | **2–4h** | About 0.5–1h for account settings and runbook | Later authorized test-mode configuration/verification of price/mode/API/envelope, Checkout/Portal, cancellation, recovery emails/retries, dispute limitations, owner flows and latency/read counts. No live settings, remote migration, deployment or restoration included. Account access/readiness and an approved testing destination are prerequisites. |
| **Required transition total** | **14–23h** | **About 1.5–2.5h** | A+B+C; no double-counting first slice below. Unexpected deployed state/integration behavior can increase the range. |
| Optional / deferrable | **Not in total; estimate only if requested** | None required now | Generic reversible blocks, Redis, prewarming, scheduling, large owner dashboard, advanced monitoring, broad dependency upgrades and unrelated legacy cleanup. Historical refund/dispute restoration is removed by approved policies, not a required later phase. |

A breakdown: account/Checkout/minimal binding schema 3–5h; access/cache/cancellation
2–3h; client integration, targeted regression/DB checks and obsolete-path/document
cleanup 4–6h. Testing the access slice spans the latter two allocations. Provider
verification includes active setup/assertion/review time; local suites take
additional unattended minutes, and dispute cancellation can require roughly an
hour of unattended observation. Test clocks cannot validate that behavior. Do not
bill all waiting as hands-on engineering or promise all waits fit one short session.

### What is reused and what drives effort

| Existing code/evidence | Reuse | Remaining effort driver |
| --- | --- | --- |
| `identity/service.js`, `identity/http.js`, cookie/CSRF/admin guards | Verified login, sessions, publicUser projection and protected mutations. | User currently requires stripeId before purchase. Make unsubscribed/prepurchase accounts work across guards and client types without weakening ownership. |
| `billing/operations.js`, Checkout ownership and fixed idempotency patterns | Keep narrow reservation, fixed-key retry, secure association and known-session recovery ideas/helpers. | Checkout now creates the customer; bind from owned session rather than customer email/event. Handle lost POST response, concurrent clicks and stale completion without copying generic global discovery. |
| `billing/evidence.js`, config/shared SDK | Tier/mode/relationship/date checks, simple invoice/line qualification, API pin and bounded errors. | Remove PI/charge/refund/dispute reconstruction; latest qualifying paid interval and unsupported shapes still need real tests. |
| `playback/service.js` | Existing normalized paid interval, public bypass, protected mapping/signing, final time check and generic errors. | Preserve final shared cancellation/deletion veto while cache hits reduce repeated provider reads. No player redesign. |
| Existing fake Stripe, HTTP fixtures and disposable PostgreSQL runner | Offline signatures, resource fixtures, real route/session tests, SQL isolation/rollback machinery. | Add cache clock/call-count/race tests and adjust approved policy expectations. Existing test counts do not prove the new semantics; don't rewrite every harness or keep obsolete ledger tests as architecture requirements. |
| Existing frontend Checkout/Portal pages and components | Keep hosted redirects, busy/error states and verified session integration. | Optional stripeId, no provider-event provisioning wait, server-owned purchase/manage eligibility and minimal owner controls. Recovery UI currently needs backend support. |

The earlier 20–36h range bundled a less specific implementation and a broader
operations/recovery allowance. Approved D1–D9 remove finance-history restoration,
review and automatic closure machinery; existing guards/fixtures can be retained.
The revised range is narrower because the target is now concrete, not because all
security/test work disappears. The main labor is changing ownership/provisioning
and schema/contracts safely, not writing a two-call Stripe reader.

Assumptions: no real subscribers per owner report; this session has not deployed
its pending migration; the existing fake-provider/local-DB tools remain usable.
Whether a migration was applied elsewhere is unverified. Any shared-data migration
or live cutover needs separately authorized inspection and a forward plan. Private
media delivery, long-recording URL renewal, email deliverability, retention/legal
follow-up, hosting recovery and launch verification are separate work. No new D9
deletion response-time commitment is chosen here.

## One bounded first implementation brief

Use [STRIPE_LED_FIRST_IMPLEMENTATION.md](STRIPE_LED_FIRST_IMPLEMENTATION.md).
It is a **4–6h subset of A**, not an extra charge or the entire transition: implement
and locally verify the access adapter, finite shared cache and terminal cancellation
veto for an already trusted selected binding. Do not start the rest of A/B/C merely
because that slice is approved later. It requires D10 acceptance and explicit
implementation authorization; both are still pending.
