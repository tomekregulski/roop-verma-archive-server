# Stripe-led billing assessment — 2026-11-01

**Subsequent review:** D1–D10 are now approved in
[STRIPE_LED_DECISIONS.md](STRIPE_LED_DECISIONS.md). Only the isolated local first
slice is authorized and implemented; see `PAID_ACCESS_IMPLEMENTATION.md`.
Broader transition remains pending. [STRIPE_LED_D10_RECOMMENDATION.md](STRIPE_LED_D10_RECOMMENDATION.md)
supersedes this document's direct-check recommendation and 20–36h estimate.
The initial assessment and decision rationale below are retained as historical.

**Recommendation for review: replace the local payment-history engine with a small
Stripe integration and request-time paid-access checks. No alternative is approved
or implemented.** Every policy proposal below requires the owner's explicit agreement.

Target: zero routine engineering hours most months, approximately five hours per
quarter or less. Occasional documented owner tasks are acceptable. This is an
operating target, not an incident-response guarantee or an estimate of transition
work. Application code, schema, migrations, tests and dependencies remain intact.
Only local documentation and public official Stripe documentation were accessed.
No account settings, real provider API, remote database, deployment or restoration.

## Why change the implementation

The current implementation reconstructs invoice/payment/charge/refund/dispute
evidence, persists individual grants, admits historical subscriptions, coordinates
customer revisions, recovers generic operations, and requires reconciliation.
These support the previously agreed behavior, but are a poor default maintenance
fit. `Operations.md` currently calls for daily reconciliation and monitoring of
pending/review receipts and scan progress; that operating model is not installed.

The frontend already redirects to Checkout and Customer Portal. The largest
correction is the backend architecture and the shared policy/contracts, not a
blanket rollback of identity, frontend or playback security work.

## Proposed minimum reliable access model

Stripe remains the financial system of record. Locally retain verified application
identity, a unique customer association, one selected subscription ID, a small
owned Checkout attempt, and deletion/disabled-account state. Do not retain a second
financial ledger or a list of invoice-backed access grants.

For each new subscriber playback URL, the server would:

1. Authenticate the existing application session and read its trusted customer and
   selected subscription IDs. Never choose an account from provider email, a client
   customer ID, a successful redirect or an arbitrary `customer.created` event.
2. Retrieve the current selected subscription from Stripe. Check customer, mode,
   configured monthly price/product, quantity and supported automatic collection.
   Reject trials, collection pauses, schedules, unexpected plan changes and unknown
   arrangements. Allow `active` or `past_due` only as lifecycle candidates, not as
   payment proof; deny canceled/incomplete/unpaid/paused states.
3. Retrieve the most recently created **paid** invoice for that subscription,
   scoped also to its customer. Require a regular positive online subscription
   invoice, no out-of-band marking or credit/discount/zero-cost settlement, and one
   complete matching recurring line. Its original service period and `paid_at`
   establish `[max(line.start, paid_at), line.end)`, which must contain now.
   Do not use invoice-level `period_end`, add a month, or extend subscription dates
   into unpaid time. Unsupported adjustments fail closed rather than trigger a
   historical reconstruction. No separate PaymentIntent/Charge/refund/dispute scan.
4. Return the existing normalized paid interval to playback and recheck authority
   at the signing boundary. Preserve public playback, private asset mapping,
   server-only signing and generic denial/unavailability responses.

This preserves no unpaid grace: a failed renewal cannot extend the last paid
invoice. `past_due` is usable only while that invoice still covers now. For example,
a paid May period cannot authorize June playback while Stripe retries June's bill.
Settling late authorizes only the remaining invoiced period. This remains a small
payment qualifier; Stripe status alone is insufficient. The invoice/line model and
scoped list API exist in the pinned Acacia reference. [Invoice list](https://docs.stripe.com/api/invoices/list?api-version=2024-12-18.acacia),
[invoice fields](https://docs.stripe.com/api/invoices/object?api-version=2024-12-18.acacia),
[line period](https://docs.stripe.com/api/invoice-line-item/object?api-version=2024-12-18.acacia).

D2 also changes historical guarantees: Stripe's current invoice dates become
authoritative instead of being compared with an immutable local copy. A provider
correction could change coverage rather than create an evidence-conflict hold.
Only the latest paid invoice is evaluated; unexpected overlapping/future invoices
or manual adjustments are not automatically reconstructed from older periods.
These limitations need explicit acceptance alongside removing the financial ledger.

Request-time retrieval removes routine projection repair and stale webhook writes
from paid-access authority. Stripe calls have explicit timeouts, bounded retries
and playback-request abuse limits. No long-lived grant cache or daily sweep is
proposed. Errors/rate limits return 503 and issue no new private URL; existing
two-hour URLs are not recalled. Expect roughly two Stripe reads per evaluation,
potentially repeated at the current signing recheck. Measure actual latency/load
before approval for launch; do not claim the small audience proves capacity.
[Stripe rate limits](https://docs.stripe.com/rate-limits).

This trades availability for simplicity: Stripe/API credential trouble prevents
new paid playback URLs even when the listener has paid. Public playback remains
independent. Stripe cannot provide a transaction spanning its reads and our signer;
neither this design nor the existing one promises instantaneous revocation of
already-issued URLs or delivered bytes. Approval of this availability tradeoff is
separate from approval of access-policy changes.

### Why not just use Stripe Entitlements?

Entitlements genuinely delegates feature mapping and subscription-driven access.
It is supported by the installed SDK (`stripe.entitlements.activeEntitlements.list`)
and has a pinned Acacia API reference; no upgrade is inherently required. But the
public guide does not establish all our strict no-grace, positive-payment,
refund/dispute and restoration rules. Do not assume an entitlement independently
proves settled payment or that a refund revokes it. For one feature, checking both
an entitlement and the paid invoice adds another dependency without removing the
payment check. Recommend deferring Entitlements unless the owner instead elects
to adopt its native access behavior after targeted Stripe test-mode validation.
Do not implement two competing access authorities. [Entitlements guide](https://docs.stripe.com/billing/entitlements?dashboard-or-api=api),
[Acacia list endpoint](https://docs.stripe.com/api/entitlements/active-entitlement/list?api-version=2024-12-18.acacia).

## Policy decision table

All rows are proposals. **Preserve** means the intended rule can stay; it is not
permission to implement a new mechanism. Owner tasks assume an owner-accessible
workflow, not SQL or a developer command disguised as an owner duty.

| Area / decision | Current requirement | Stripe capability and limitation | Smallest application responsibility | Proposed policy / user effect | Owner task, notification and engineering |
| --- | --- | --- | --- | --- | --- |
| Signup / D1 | Register names/email; create Stripe customer before local account; recover provisioning automatically; verify email before Checkout. | Checkout can create the customer during subscription purchase and collect billing details. It does not authenticate our application. | Keep a minimal verified app account before purchase. Create one owned, idempotent Checkout attempt; bind returned customer/subscription through the server-created intent. Reuse an existing trusted customer on subsequent purchases. | Keep verified login; defer Stripe customer creation until Checkout. No paid access from signup/return URL. Billing-profile edits do not change login email. | Normally none. A stuck attempt is visible to the user with Help and to the owner through the support request. Exceptional unresolved association can require engineering; no automatic global customer discovery. |
| Payment authority / D2 | Independently verify invoice, PaymentIntent, captured Charge, amounts and original periods; persist grants. | Stripe exposes paid invoices and their recurring service periods. `active` can also occur with unpaid invoices or asynchronous payment methods. | Use the bounded request-time model above, for the one supported positive monthly card subscription. Keep simple out-of-band/credit/unsupported-shape rejection. | Trust Stripe's regular paid-invoice state without independently reconstructing capture/payment history. No new trials, discounts, credit settlement or unpaid grace. Malformed/manual arrangements can require owner correction instead of automatic reconstruction. | No routine action. Owner must use supported Checkout/Portal and avoid manual plan/credit/pause changes. Unexpected access denial comes through customer support. Engineering only if behavior contradicts supported configuration. |
| Renewal / failed payment — preserve | Successful payment buys only its original period; failed renewal adds no time; existing valid coverage can finish. | Billing creates invoices, retries eligible failures, sends hosted recovery links and can cancel after recovery is exhausted. Some declines require customer intervention. | Read current subscription plus last paid invoice; allow only its current period. No app retry scheduler or dunning email system. | Preserve no grace. Configure Stripe to cancel after retry exhaustion; recovered payment restores only remaining invoiced coverage. | Customer handles Stripe emails/Portal. Owner handles unusual customer questions. Engineer is not involved in ordinary declines or renewals. |
| Customer cancellation — preserve | Keep paid access until the original end; stop future renewals. | Portal supports period-end cancellation and undoing scheduled cancellation before it takes effect. | Continue current paid-invoice access while subscription remains eligible; deny after period ends/cancellation takes effect. | Use period-end cancellation as the customer path. Preserve ordinary cancellation experience. | Customer self-serves. Owner answers questions only; no engineering. |
| Immediate cancellation / D3 | Even immediate cancellation preserves unrevoked paid coverage through its original end. | Dashboard can cancel immediately; a canceled subscription cannot be restarted. | Treat canceled as ineligible; retain no separate surviving grant. | **Change:** owner-initiated immediate cancellation ends new playback issuance immediately. Use period-end cancellation whenever paid remainder should survive. Existing URLs may last up to two hours. | Owner chooses the correct cancellation timing in Dashboard when acting on a support request. No engineering for normal cancellation. |
| Full refund / D4 | Automatically revoke the refunded invoice's period only; other paid periods survive. | Dashboard can cancel immediately and refund the latest payment in one cancellation workflow; arbitrary payment refunds are separate financial actions. | Read subscription eligibility; do not reconstruct all past refunds. | **Change:** when ending present access, owner uses cancel-now + refund. A refund-only action, especially for a historical payment, does not independently change access. Other-current-period preservation is no longer automatic when owner cancels the entire subscription. | Owner acts on refund request in Dashboard and confirms cancellation/refund outcome. Mistaken refund-only action can leave access/renewal running until owner corrects it. Engineer only for application malfunction. |
| Partial refund / D5 | Preserve paid coverage and create local review state. | Dashboard supports partial refunds. | No local review ledger; normal current-subscription check continues. | Preserve access for a payment refund; **drop app-generated partial-refund review**. Owner decides separately whether cancellation is needed. Credit notes/credits remain outside the supported payment path. | Owner performs/reviews the refund they initiate and handles Stripe pending/failed outcomes. No routine engineering. |
| Open / lost dispute / D6 | Automatically suspend only the affected paid period; lost dispute permanently revokes it. | Stripe can automatically cancel on a full-amount credit/debit-card dispute, with about a one-hour delay. It does not cover partial disputes and cannot be validated using test clocks. | Observe canceled status; no per-invoice dispute hold/revocation ledger. Do not block automatic resubscription with a custom financial-history blacklist. | **Change:** cancellation ends the selected subscription, potentially affecting a later paid period when an older charge is disputed. Partial/inquiry cases need owner judgment. Access may continue until cancellation and existing URL expiry. | Owner receives Stripe dispute email/Dashboard notification, checks cancellation, handles unsupported cases and evidence deadlines. No engineering for ordinary Dashboard handling; failures of configured cancellation/integration are exceptional. |
| Won / withdrawn dispute / D7 | Verify resolution/payment/refunds and automatically restore original unexpired paid remainder. | A canceled subscription cannot be reactivated; winning a dispute is not automatic subscription restoration. | No restoration engine or credit-time ledger. | **Change:** no automatic restored remainder. Owner resolves compensation/refund in Dashboard and customer can purchase again through Checkout. A new paid subscription is not a free restoration; agree compensation before asking for another payment. | Owner uses Stripe outcome notification to contact customer and settle compensation. Engineer only for an association/integration defect. |
| Multiple subscriptions / D8 | Prevent another ongoing subscription; quarantine duplicates while preserving admitted coverage; never stack time. | Checkout can redirect customers with existing subscriptions to Portal; documented detection covers active/past-due/unpaid/paused and requires its configured login link. It is not a documented atomic cross-session uniqueness guarantee. | Keep one active local Checkout reservation, its fixed key and current selected subscription. Check existing ongoing billing before a new session; reuse known unfinished session. Never sum subscription durations. | Preserve one intended subscription/no stacking. **Change:** unexpected external duplicates are an owner refund/cancellation task, not historical admission/quarantine automation. Access follows the selected legitimate subscription; old events cannot replace it. | Customer support or an occasional owner Dashboard review reveals duplicates; no guaranteed instant duplicate alert is assumed. Owner cancels/refunds extra subscription. Unclear ownership may require engineering. |
| Account deletion / D9 | Automatically prove all subscriptions, schedules, Checkout sessions, collectible invoices and operations closed before deleting identity; retain billing history/tombstone. | Portal cancels subscriptions, not our application account. Cancellation can leave pending invoice items; deleting a Stripe customer is irreversible and is not app-data deletion. | Accept an authenticated deletion request, block new Checkout, and let owner complete a documented billing checklist. A small owner-accessible completion action atomically deletes identity/sessions and prevents stale Checkout recreation; no financial-history proof engine. | **Change:** deletion is an owner-assisted request, not automatic exhaustive closure certification. Keep login/Portal available until closure is confirmed. Do not silently treat cancellation as account deletion or delete Stripe financial records. | Owner receives support/deletion request, closes billing and open Checkout, resolves invoices, then completes local deletion. **Current admin API has no reviewed owner-facing completion UI**: include that one-time work or explicitly retain per-deletion engineering. |
| Access availability / D10 | Current local reader can authorize an existing grant without Stripe being reachable; webhook/reconciliation lag can stale it. | Stripe supplies current state but has outages/rate limits. | Request-time checks; fail 503 on uncertainty. Keep bounded calls and abuse protection. | **Change:** new paid playback depends on Stripe availability; remove daily grant reconciliation. Previously issued media URLs remain valid until expiry. | Owner sees customer report or configured service alert, checks provider status, and asks users to retry if external. Persistent application-specific failures require engineering. |

Relevant official configuration: [Checkout customer creation](https://docs.stripe.com/api/checkout/sessions/create?api-version=2024-12-18.acacia),
[Portal capabilities](https://docs.stripe.com/customer-management),
[payment retries](https://docs.stripe.com/billing/revenue-recovery/smart-retries),
[hosted recovery emails](https://docs.stripe.com/billing/revenue-recovery/customer-emails),
[cancellation, refunds and dispute-cancellation limits](https://docs.stripe.com/billing/subscriptions/cancel),
[refund handling](https://docs.stripe.com/refunds),
[dispute notifications](https://docs.stripe.com/disputes/how-disputes-work),
[subscription limiting](https://docs.stripe.com/payments/checkout/limit-subscriptions),
[customer deletion](https://docs.stripe.com/api/customers/delete).

## Integration limits and required setup, after separate approval

- Keep Stripe **17.5.0**, request API **2024-12-18.acacia**, Prisma **4.12.0**.
  Current documentation includes newer billing modes and status-resolution features;
  do not copy those examples into the pinned implementation. Check installed SDK
  types and pinned reference, then validate the actual account in authorized test
  mode. This assessment inspected no account configuration or webhook version.
- One positive monthly price, quantity one, automatic card collection; no trials,
  coupons, plan/quantity switching, collection pauses, scheduled changes or
  asynchronous non-card payment methods. Reject unexpected supported-scope changes
  explicitly. These restrictions preserve existing scope; enabling new billing
  features later requires a reviewed access model.
- Portal: invoices, billing details, payment-method updates, period-end cancellation.
  Disable plan/quantity changes and retention coupons. Portal billing email changes
  must not rebind application login; explain the distinction to users. Customer
  signup still needs our email proof; Stripe Link/Portal email login is not our
  application session. [Portal configuration](https://docs.stripe.com/customer-management/configure-portal).
- Enable Stripe failed-payment/action-required emails with hosted recovery links,
  appropriate retries, and cancellation after exhaustion. No recurring owner task
  to chase ordinary declined cards. Enable supported full-card-dispute cancellation;
  owner covers unsupported dispute cases. [Subscription lifecycle caveats](https://docs.stripe.com/billing/subscriptions/overview).
- Keep verified raw-body webhooks, limited event selection, server-generated
  Checkout intent references, unique constraints and atomic association writes.
  Signed `checkout.session.completed`/return-time retrieval links purchase to an
  already verified account; neither path grants access from a URL or email alone.
  Duplicate/out-of-order events cannot replace a newer selected subscription or
  recreate deleted identity. A compact idempotent association handler remains;
  no full financial event ledger is needed for request-time playback authority.
  [Webhook delivery and verification](https://docs.stripe.com/webhooks).
- Persist the owned attempt and fixed parameters/key before Checkout POST. Retry
  that key inside a conservative window; Stripe can prune API-v1 keys after 24h.
  After an unresolved old attempt, do not issue a fresh key/second purchase blindly.
  Owner review replaces account-wide automatic discovery. Reuse/retrieve known
  session IDs for next-login recovery when return/webhook was missed; expire open
  sessions deliberately before releasing a reservation. This residual state is
  necessary to avoid turning simplified recovery into duplicate billing.
  [Idempotency limits](https://docs.stripe.com/api/idempotent_requests).
- Stripe notifies owners about disputes, but does not promise a bespoke alert for
  every app association/duplicate error. Put Help on stuck signup/playback flows;
  route support requests to a monitored owner inbox. Configure and test available
  Stripe delivery notices and existing hosting error alerts in a later authorized
  setup task. Until then, failed-webhook discovery is Workbench/customer report;
  no unconfigured monitoring or daily engineer review is assumed.

## Adjacent-work audit and disposition

| Area / evidence | Keep | Simplify / remove / defer after approval |
| --- | --- | --- |
| Frontend `src/views/ManageAccount.tsx`, `src/util/handleCheckout.tsx` | Existing Checkout/Portal redirects, verified session and ownership-aware requests, return/error states. | Remove custom billing-profile/payment UI if found elsewhere; no current payment-update caller was found under `src`. Retire the custom backend payment-method route after caller verification. Consolidate checkout/resubscribe endpoints. |
| Frontend `src/views/Signup.tsx`, `src/context/AuthContext.tsx`, `IDENTITY_HANDOFF.md` | Email verification, generic login responses, CSRF/cookie integration. | Remove dependency on precreated Stripe customer and delayed `customer.created` provisioning. `stripeId` becomes optional until purchase. Current status helper treats trialing/incomplete as allowed for account UI; use server-provided purchase/manage eligibility rather than duplicate lifecycle rules. Names/billing details can be collected by Checkout; do not treat provider email edits as login changes. |
| Frontend `src/context/AudioContext.tsx`, `PLAYBACK_HANDOFF.md` | Server decides playback; no cached financial ledger in the player. Track/session changes clear media; URL expiry and error handling. | Its display-status dependency only resets playback; it is not financial authority. Update handoffs away from durable invoice-grant prerequisites. Long-audio renewal/private media work remains separate. |
| Backend `billing/evidence.js`, `service.js`, `reader.js`, `reconcile.js` | Small shape/association/period checks, API pin, bounded calls and generic errors. | Replace persisted financial grant/revocation/revision/admission/replay engine with request-time reader; remove routine reconciliation CLI and scan scheduling from target. Keep old behavior/tests intact until replacement approval. |
| `billing/operations.js`, registration/deletion controllers | Trusted account/customer binding, Checkout ownership, durable one-attempt idempotency and account-deletion intent. | Let Checkout create the customer; replace global customer discovery, historical admission, generic operation replay and exhaustive deletion scans with narrow attempt handling and owner workflows. No full new admin dashboard; only necessary completion/recovery controls. |
| `prisma/schema.prisma`, pending billing migration | Identity proofs/sessions/rate limits, customer uniqueness, Checkout ownership, one selected subscription and minimal deletion marker. | Candidate to remove: `PaidInvoiceGrant`, reconciliation cursors, full subscription history/admission, generic registration-operation ledger and financial receipt processing fields. Keep a narrow attempt record and small audit/dedupe if useful. User's required `stripeId` and subscription relations need deliberate redesign; do not simply delete the migration file. |
| `playback/service.js`, `PLAYBACK_API.md` | Session requirement, normalized paid interval and exact expiry, public bypass, no private signer on denial, protected asset mapping. | Preserve its interval adapter interface where possible; replace its persisted-evidence prerequisite and review request-time signing recheck latency. Do not import Stripe status rules into the player. |
| `test/support/billing-cases.js`, DB/HTTP/browser suites | Signature, ownership, public/private separation, expired/unpaid denial, fixed service periods, duplicate Checkout safety, DB rollback/unique ownership and stale/deleted-account protection. | Reframe accepted policy cases against selected model. Remove grant-history/reconciliation implementation tests only alongside approved deletion of those mechanisms. Keep tests exposing changed refund/dispute/cancellation behavior as explicit new expected policies. Fake fixtures are not Stripe semantics evidence. |
| `Operations.md`, billing/design/identity/playback handoffs, CI | Existing authentication/security checks and separate known telemetry schema diagnostic. | Replace daily scan/review/CLI duties with owner runbooks and event-driven escalation. CI retains real disposable-DB identity/ownership checks; no financial-ledger migration suite if that schema is not shipped. Preserve historical results as dated, not current approval. |

This is a current-source dependency audit of both repositories and their handoffs,
not a review of every historical or unmerged branch. Identity/catalogue security,
private media protection and CI are not shown to duplicate Stripe responsibilities.
Other workstreams need a targeted contract update; no broad rollback is justified.

## Ordinary quarter and exceptional work

**Planning estimates, not measured operating history:** with this tiny audience and
stable configuration, owner spends roughly 30–60 minutes per ordinary quarter on
a short Dashboard/support/settings check, plus individual refund/dispute/deletion
requests. Customers self-serve routine management. No daily billing scan, log review
or engineer-run reconciliation is part of the target. Owner must still monitor
their support/dispute inbox; disputes can have deadlines and are not quarterly tasks.

Engineer: zero routine billing work in most months; reserve about 1–3 hours per
ordinary quarter for an alert/dependency review and small necessary fixes, leaving
some of the five-hour budget for exceptions. These are budget allocations, not a
claim that five hours can cover all app maintenance. Mail/session delivery, hosting,
database backups, media delivery and security updates have separate responsibilities.
Owner-accessible deletion/recovery and tested notification routing must exist
before claiming the owner can run billing without engineering.

| Exceptional event | Owner action / how known | Likely engineering |
| --- | --- | --- |
| Refund / partial dispute / deletion | Customer request or Stripe notice; follow Dashboard runbook and completion control. Allow roughly 10–30 minutes for a straightforward request. | Normally none after owner controls exist. |
| Formal dispute evidence deadline | Stripe email/Dashboard; accept or respond and resolve access/compensation. | Usually none for billing code; evidence collection/product investigation can exceed the budget. |
| Stripe outage/rate limiting | Support/host alert; check provider status, communicate retry. | None for a transient provider outage; sustained app-generated load/credential failure can require hours. |
| Unknown purchase outcome / ownership conflict | Stuck Checkout support request; inspect exact session/reference and cancel/refund duplicate if needed. | Zero if a documented narrow recovery control handles it; otherwise potentially several hours. No routine SQL expectation. |
| Login/mail outage, compromised secret, breaking SDK/API/runtime change, host/database incident | Provider/service/security notification or customer report; escalate. | Can exceed five hours, sometimes substantially. Full incident recovery is not eliminated by Stripe. |

## Transition effort and review gate

1. Owner reviews D1–D10 individually; disagreement on one does not approve the
   others. Preserve ordinary cancellation and no unpaid grace. In particular,
   explicitly decide immediate cancellation, refund-only behavior, delayed/partial
   dispute handling, restoration/compensation, manual duplicate/deletion handling,
   and live-Stripe playback availability. No policy decision has been made here.
2. Planning estimate: **20–36 engineering hours once**, plus roughly 1–2 owner hours
   for policy/runbook review. Allow 6–10h for narrowed backend/ownership/reader,
   3–6h for frontend/schema/contracts, 5–8h for regression/DB/browser checks, and
   6–12h for owner controls, runbooks and separately authorized Stripe test-mode
   configuration/validation. Overlapping tasks make the total approximate; a new
   admin product or unexpected deployed data can increase it. This is not a quote.
3. Current implementation is uncommitted on backend `main`. This session has not
   deployed its migration; owner reports no real subscribers. Preserve the work
   for comparison, then replace only the approved paths. Before removing any schema
   artifact, verify through a separately authorized process whether it has been
   applied anywhere shared. Applied migrations require a forward plan; no reset,
   remote inspection or migration is authorized by this assessment.
4. Validate the supported payment path, original periods, no grace, Portal
   cancellation, cancel/refund workflow, dispute settings/limitations, duplicate
   attempts, missed-return/webhook recovery and owner deletion. Test clocks cannot
   establish dispute auto-cancellation. Real Stripe test-mode actions need their own
   authorization; current synthetic suite cannot establish these provider facts.
5. Remove the superseded financial engine/schema/CLI only with the accepted
   replacement, tests and current handoffs. Keep separate telemetry drift visible.
   Private media, deployed verification and restoration remain separate work.

**Decision requested from management:** approve or revise the policy rows and
availability tradeoff first; only then authorize a concrete replacement task.
Do not approve the existing large engine merely because it passes tests, and do
not remove necessary ownership/retry/security controls merely to reduce line count.
