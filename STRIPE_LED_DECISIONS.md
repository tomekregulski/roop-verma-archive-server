# Stripe-led policy decision review

Current status: **D1–D10 approved (D2/D9/D10 revised by the owner on 2026-11-07); C1 selects one local purchase/access/deletion composition**.
See `STRIPE_LED_PURCHASE_IMPLEMENTATION.md`. Existing-data/retention preflight, operational and real-provider
actions remain separately gated. Older dated transition statuses below are historical. The review procedure/history below records the
original proposals; table statuses are authoritative.

Source: `STRIPE_LED_ASSESSMENT.md`. All proposals remain pending until the owner
explicitly approves or rejects each item. Discussion and recommendations are not
approval. No implementation or provider changes are authorized by this review.

Review order: D3 immediate cancellation, D4 full refunds, D5 partial refunds,
D6 open/lost disputes, D7 won/withdrawn disputes, D1 signup, D2 payment authority,
D8 multiple subscriptions, D9 deletion, then D10 Stripe availability separately.
The revised estimate in `STRIPE_LED_D10_RECOMMENDATION.md` supersedes the original
20–36 hour estimate. The bounded 4–6 active-engineer-hour first implementation
brief remains separately subject to authorization.

| Decision | Status | Approved user impact / rationale |
| --- | --- | --- |
| D1 Signup | Approved | Create a minimal verified app account before purchase. Backend creates an owned Checkout session; Checkout collects billing details and creates a Stripe customer as needed. Securely bind customer/subscription to the verified account, retaining ownership and duplicate-purchase safeguards. No access from redirect alone; no customer.created-based account provisioning. Stripe billing-email changes do not change login email. Unsubscribed accounts are allowed; stuck purchases get retry/help and exceptional association failures may need support. |
| D2 Payment authority | Revised and approved 2026-11-07 | Access follows the current status of the securely associated intended subscription: active and past_due allow; canceled, unpaid, incomplete, incomplete_expired, paused and trialing deny. Missing/unknown/malformed status and untrusted association fail closed. Intended tier/product/mode and ownership validation remain. Invoice amount, settlement/history and original paid periods no longer qualify access; no invoice reads or fabricated paid periods. Period-end cancellation allows while active; refunds alone do not revoke. No trial/discount/tax/credit product features are added, and safe supported purchase/completion checks remain separate. Stripe owns recovery; indefinitely past_due can mean indefinitely enabled access. |
| D3 Immediate cancellation | Approved | Customers cancel at period end and retain their paid remainder. No application immediate-cancellation or proration feature; owner normally uses period-end cancellation. If Stripe reports the subscription canceled, stop issuing new paid playback URLs. Already-issued URLs may remain usable until expiry (currently up to two hours). Exceptional refunds are separately pending under D4. |
| D4 Full refunds | Approved | Owner-managed refunds alone do not revoke access or stop renewal. To refund and end service, owner explicitly cancels immediately and refunds in Stripe; D3 controls new playback issuance. No application reconstruction of refund history or automatic per-period revocation. Owner checklist must distinguish refund-only from refund-and-cancel, including historical refunds. |
| D5 Partial refunds | Approved | Owner handles partial refunds in Stripe; refund alone does not change playback access or stop renewal. No application refund-review record or automated review workflow. Any service termination is a separate cancellation under D3; owner handles follow-up through Stripe/customer support. |
| D6 Open/lost disputes | Approved | Configure Stripe cancellation without proration for supported full-amount card disputes; application follows canceled status under D3, without a dispute ledger or per-invoice suspension. Owner monitors dispute notifications and handles responses, partial disputes, and unsupported cases. Accept approximately one-hour provider cancellation delay and validity of already-issued URLs until expiry. Disputing an older charge can end access during a later paid period. Won/withdrawn dispute behavior remains pending under D7. |
| D7 Won/withdrawn disputes | Approved | No automatic restoration of access or unused paid time after dispute-related cancellation. Owner reviews resolution and agrees compensation before asking the customer to purchase a new subscription through Checkout. New purchase charges again; it is not free restoration. No restoration engine or credit-time ledger. Subscriptions never canceled require no restoration. |
| D8 Multiple subscriptions | Approved | One intended ongoing subscription per account. Preserve ordinary duplicate-purchase safeguards, reuse unfinished Checkout attempts, and direct existing subscribers to billing management. Access follows one securely associated subscription; no stacking time. Unexpected duplicates require owner cancellation/refund through Dashboard/support rather than automatic historical classification/repair. No instant duplicate alert is assumed; ambiguous associations may require engineering. |
| D9 Account deletion | Revised and approved 2026-11-07 | Support-only customer contact; no customer deletion-request UI, automatic notification or pending queue. A current persisted administrator initiates an exact account after verifying request ownership through support and confirming its matching email. Pending state blocks new purchase/association but preserves login, trusted Portal and ordinary access until completion. Minimal owner review/abandon/completion retains account locks, exact Checkout/billing closure, Dashboard attestation, transactional revocation/deletion and late-callback/security tombstones. Cancellation remains separate. Stripe financial records remain untouched; no SLA or broader retention policy is approved. |
| D10 Stripe availability | Revised and approved 2026-11-07 | Keep the shared PostgreSQL status-evidence cache, fresh at most 15 minutes measured before provider reads. The old paid-period expiry cap is removed; no paid periods are invented. No sliding freshness or stale-on-error extension. Validate identity/current selection on every evaluation; terminal cancellation veto beats stale events and in-flight fills, and old selection events/fills cannot affect replacement. Cold/expired caches and DB outages fail closed. Missed cancellation can permit new issuance for up to 15 minutes after effective cancellation, plus provider delay and already-issued URLs (up to two hours). Final playback authorization remains. |
| Transition effort and implementation scope | C1 local consolidation authorized and implemented; activation/provider verification pending | Paid access, D1/D8 purchase and the bounded D9 owner-assisted controls are implemented locally. Evidence: `STRIPE_LED_PURCHASE_IMPLEMENTATION.md`. D9's 7–10h estimate was planning, not a hard cutoff or operational rollout approval. Normal local cutover and forward schema/code removal are implemented. Real provider/existing DB action, retention disposition, deployment, restoration, commit/push/merge remain gated. |

D9's bounded local implementation was subsequently authorized and completed on
2026-11-02. The request/owner completion controls and approved deletion/retention
rules are recorded in `STRIPE_LED_PURCHASE_IMPLEMENTATION.md` and `Operations.md`.
This supersedes owner-control gates in the older transition row only for that
isolated slice; C1/runtime/provider/existing-data actions remain separately gated.

## Approved bounded simplification — 2026-11-07

The owner's implementation brief supersedes only the D2, D9 and D10 provisions
shown in their authoritative rows above. D1 and D3–D8 are unchanged. Local code,
forward migrations, fake-provider tests and fresh disposable PostgreSQL checks
are authorized; existing/remote databases, actual backups/providers, applying to
existing databases, rollout and commits/pushes/merges remain unauthorized.
TrackPlay/NetworkError removal must refuse nonempty tables pending an explicit
owner disposition. Earlier policy and test descriptions below are historical.

## Decision history

- Review opened with all decisions pending.
- Owner explicitly approved D3: customer period-end cancellation, no app immediate-cancellation/proration feature, and denial of new paid playback URLs when Stripe reports cancellation. This does not approve refund/dispute policies, the request-time architecture, implementation, or provider changes.
- Owner explicitly approved D4: refund-only preserves ordinary subscription/access behavior; refund-and-end-service requires explicit Stripe cancellation as well as refund. No custom refund-history/per-period revocation machinery. Other decisions and implementation remain pending.
- Owner explicitly approved D5: partial refunds preserve normal access and renewal, with owner-managed follow-up and no app refund-review workflow. Implementation and provider changes remain unauthorized.
- Owner explicitly approved D6, including supported-dispute cancellation, owner-managed exceptions, delay/existing-URL limitations, and possible impact on later paid periods. D7 and all other pending decisions remain unapproved; no settings or code changes authorized.
- Owner explicitly approved D7: manual compensation/resolution and a new Checkout purchase for resuming canceled service; no automatic paid-remainder restoration. D3–D7 are approved. D1, D2, D8–D10 and transition scope/cost remain pending. No implementation or provider changes authorized.
- Owner explicitly approved D1: verified application account first, Checkout-led customer creation and secure purchase association, with the user impacts above. D2, D8–D10 and transition scope/cost remain pending. No implementation or provider changes authorized.
- Owner explicitly approved D2 and its supported-product/payment-evidence limits. D8–D10 and transition scope/cost remain pending. D10 availability and implementation/provider changes are not approved by D2.
- Owner explicitly approved D8: practical duplicate-purchase prevention plus manual exceptional cleanup, with no stacking or automatic duplicate refunds. D9, D10 and transition scope/cost remain pending; no implementation/provider changes authorized.
- Owner explicitly approved D9 after confirming account deletion is distinct from subscription cancellation. D1–D9 are approved; D10 and transition scope/cost remain pending. No implementation/provider changes authorized.
- Owner agreed to leave D10 pending for the bounded assessment above. D1–D9 policy approvals do not select a direct-check or cached implementation. Transition estimate and scope remain unapproved.
- After reviewing the bounded recommendation, owner explicitly confirmed D10 approval, including freshness/outage and terminal-veto guarantees and the approximately 2h15m cache-plus-URL window after effective cancellation. All D1–D10 policies are approved. The 4–6-hour local first implementation brief and broader transition remain unauthorized pending a separate decision.
- Owner subsequently explicitly authorized the local first implementation brief with its boundaries intact, treating 4–6 active engineering hours as an estimate and requiring material scope growth to be surfaced before expansion. That isolated slice is implemented; evidence and integration dependencies are in `PAID_ACCESS_IMPLEMENTATION.md`. No broader transition or runtime/provider action is authorized.

- Owner explicitly authorized implementation of the D1/D8 scope proposal, with reuse, unchanged normal runtime and material-growth reporting. That isolated slice is implemented; see `STRIPE_LED_PURCHASE_IMPLEMENTATION.md`. D1–D10 policies are unchanged. C1 removal, owner controls and operational/provider actions remain separately gated.
