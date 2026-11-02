# D9 owner-assisted deletion — isolated candidate, 2026-11-02

This is local staged functionality, not normal-runtime rollout. See
[implementation and current evidence](STRIPE_LED_PURCHASE_IMPLEMENTATION.md).
Use the existing `--purchase` browser fixture; it adds `/owner/deletions` using
persisted-session authentication and current server-side `isAdmin`, never the
frontend development AdminLogin. A real owner identity/role, deployed protected
route and `ACCOUNT_DELETION_SUPPORT_EMAIL` must be configured at the later C1 /
provider-activation gates. Existing EmailJS support configuration exposes no
backend recipient; do not invent one. No provider action was performed here.

A customer explicitly requests deletion in candidate Account. This blocks new
purchases/association, preserving login, trusted Portal and normal playback policy.
Subscription cancellation stays separate and retains the app account. A pending
request sends one best-effort templated notification with email/time/protected
review link. Acceptance is not inbox delivery. Failed/uncertain/missing delivery
never rolls back the request; no retries or external exactly-once guarantee.
Owners should inspect the pending list even if no notification arrived. No
response-time promise is approved. Withdrawal is support-assisted through the
owner review and does not change Stripe billing or ordinary purchase safeguards.

Before **Complete app account deletion**, review the correct account and:

1. Verify the exact Stripe mode, trusted customer and every owned Checkout attempt.
   Email alone is insufficient; include inactive attempts and unassociated results.
2. Resolve each Checkout outcome. Open Sessions must close/expire. Unknown/missing
   Session IDs, old attempts, absent bindings, timeouts or missing webhooks do not
   prove no purchase. For a lost ID, enter only an exact Dashboard Session matching
   the retained immutable attempt metadata/mode/ownership. No fresh Checkout or
   broad provider-history discovery is used. Unknown cases stay pending and may
   require engineering; do not delete the attempt to bypass a blocker.
3. Review **all** subscriptions and duplicates, including unassociated ones.
   Normal period-end cancellation means wait for actual closure; a scheduled
   cancellation alone cannot complete deletion.
4. Review schedules, draft/open invoices, retries and pending invoice items. Make
   an explicit Dashboard disposition for every item; the app does not inspect or
   reconstruct these financial histories.
5. Apply approved D3–D8 exceptions: refund alone does not cancel or revoke ordinary
   access; refund-and-end-service needs explicit cancellation. Handle partial
   refunds, disputes, duplicate cleanup and any agreed compensation in Dashboard /
   support. There is no automatic restoration, refund or entitlement editor.
6. Recheck Dashboard immediately before attesting actual closure. Completion does
   fresh exact reads and rejects stale local review, open/unknown outcomes or
   ongoing known subscriptions. Provider trouble blocks completion; local review
   still permits support withdrawal. Refresh/review after any stale or ambiguous
   result before retrying. A repeated completed request never recreates identity.

Completion atomically deletes User, all sessions/login links/CheckoutOwnership,
legacy Token and individual TrackPlay rows; aggregate Track.plays is preserved.
It clears cache, retains customer/subscription/attempt deletion tombstones without
automatic expiry, and removes names/email/request JSON from deleted live-v2 app
attempts. Linked diagnostics lose structured identity and entire message/type
fields; known embedded identifiers are also detected in unlinked error messages.
Codes/times remain. Unknown encodings, arbitrary unlinked author text (including
Tribute), provider mail, logs and backups are not an erasure guarantee or a new
retention policy. Unsupported legacy immutable requests block completion pending
investigation/C1 retention preflight. Existing public legacy telemetry/listening
writers and play counting were not repaired by D9.

Stripe customers, payments, invoices, refunds and other financial records remain.
App deletion does not immediately invalidate issued media URLs (up to their
existing expiry). Late candidate callbacks cannot recreate identity or associate
retained billing with a later same-email account. **Do not expose this candidate
alongside legacy provisioning/recovery**: C1 must replace that normal composition
and remove its old recovery paths before operational use.

---

# Isolated Stripe-led slice — 2026-11-01

`PAID_ACCESS_IMPLEMENTATION.md` records the approved local access adapter/cache/veto
slice and tests. It is not selected by normal runtime. No cache service, scheduler,
reconciliation duty or owner repair control was added. The procedures below still
describe the retained old engine; they are not the target operating model for the
approved Stripe-led replacement. Further integration/provider actions need approval.

---

# Billing operations — current local implementation

Start with [BILLING_API.md](BILLING_API.md) for the flow, file map and policy.
[Test commands/results](test/README.md) are maintained in one place. Older notes
below retain their original dates; the current contract supersedes their billing
limitations. Service restoration remains deferred.

## Configuration and local checks

Use Node 24.19.0 and the locked dependencies/generated Prisma client. The server
requires the explicit tier/mode settings in `.env.example` and its existing
Stripe API/signing secrets. Webhook endpoint version and genuine payload size
remain unverified. No real provider calls or existing/remote migrations were made.

- `npm test`: full synthetic regression suite.
- `npm run test:billing:local`: new disposable loopback PostgreSQL cluster with
  fake providers; requires the optional `EMBEDDED_POSTGRES_MODULE` test tool.
- `npm run test:billing:db`: guarded, explicitly supplied disposable local database.
- `npm run assess:schema:local`: separate strict diagnostic, still failing only
  for the known `NetworkError.errorCode` nullability mismatch. Do not suppress it.

## Inspect first, apply explicitly

The reconciliation CLI never loads `.env`. Supply an explicit
`BILLING_DATABASE_URL`, the server billing allowlist and a provider choice.
The examples use an offline resource fixture in a disposable database. The fixture
exports a fake Stripe client; see `test/support/billing-provider.js` and the real
CLI exercise in `test/integration/billing.postgres.js`.

```sh
# Inspect one known customer. Stores no changes.
node scripts/reconcile-billing.js --fixture /absolute/path/provider.cjs --customer cus_test_a
# Apply the same resource-based repair.
node scripts/reconcile-billing.js --fixture /absolute/path/provider.cjs --customer cus_test_a --apply
# Sweep known bindings and recover pending operations, in bounded pages.
node scripts/reconcile-billing.js --fixture /absolute/path/provider.cjs --limit 10 --invoice-limit 10 --apply
# Resume after the last fully completed customer from that report.
node scripts/reconcile-billing.js --fixture /absolute/path/provider.cjs --after cus_last_completed --apply
# Explicitly restart one customer's invoice scan.
node scripts/reconcile-billing.js --fixture /absolute/path/provider.cjs --customer cus_test_a --restart --apply
```

`--provider stripe` makes real provider reads, even without `--apply`, and requires
separate authorization. It was not used here. No flag accepts dates, payment
facts or entitlement results. A customer-only scan needs an existing trusted
binding; use a batch to recover pending registration/Checkout operations.

## Reading the result

| Result/state | Meaning and next action |
| --- | --- |
| `complete: false`, invoice cursor present | That customer's scan needs another batch. Its invoice cursor is stored only on apply. |
| Customer cursor (`--after`) | Last fully completed customer; resume after it. Do not advance past a failed page. |
| `qualifying` in inspect | Financially qualifying invoices before admission/revocation checks; not a promise of access. |
| `operations.unresolved` | No unique external result was found. Retain the reservation/key and inspect its outcome. |
| `failures` | Retry/repair is incomplete; CLI exits nonzero. No absence or successful processing is inferred. |
| `review` receipt / issue code | Durable exception, not a successful payment grant. Inspect the bounded reason and original facts. |

Invoice progress commits with the repaired page under customer revision control.
Incomplete pages/errors never prove absence or erase valid evidence. After a full
scan, `lastFullScanAt` updates and the next sweep starts from the beginning. An
inspect-only cursor is a proposal, not stored progress: apply must start with the
original cursor. A resource scan repairs projections even if receipts say applied.

Operation recovery only discovers already-created objects and commits local
association/ownership. Normal registration/Checkout retries can repeat their fixed
key within 23 hours; older absent/ambiguous outcomes stay unresolved. Recovery
never creates a fresh key or performs a provider POST, cancellation or refund.
Pending/review receipt replay follows the resource sweep; version, mode and
malformed-envelope exceptions cannot become compatible through replay.

## Cases requiring attention

Partial refunds preserve remaining paid coverage while under review. Open disputes
need fresh verified `won` resolution (including provider-confirmed withdrawal),
with current payment/refund checks. Closed inquiries/unknown resolutions do not
substitute for that proof. Full refund/lost-dispute revocation remains terminal.
For immutable evidence conflicts, retain the original period and inspect the
invoice/line/payment/audit facts before a separately reviewed repair. Never add
time or rebind by email to resolve an exception.

Pending account deletion keeps login/paid access available and blocks new Checkout.
Close billing through the approved provider workflow, then retry DELETE. Every
subscription, schedule, Checkout and collectible invoice/retry must be freshly
confirmed closed. No automatic provider cancellation/debt forgiveness occurs.
Confirmed local deletion retains the binding/tombstone and billing history.

Monitor oldest pending receipts, review counts, unresolved operations, unscanned
bindings and last full-scan times. The existing admin webhook-log route returns
the latest 100 minimal receipts. No scheduler/monitor was installed. Before
subscribers, separately arrange daily reconciliation and accept missed-event lag.
Real Stripe semantics, protected delivery and deployed behavior remain unverified.

---

# Current identity operations

Use [IDENTITY_API.md](IDENTITY_API.md) and [test/README.md](test/README.md) for configuration, local checks and the manual walkthrough. Provider sender setup and a designated test inbox remain pending; no real delivery has been verified. The local demo never loads real service credentials. No remote migration or cleanup has been run.

## Webhook authenticity — local verification, 2026-10-22

`POST /api/v1/payment/webhooks` requires `Stripe-Signature` and the server-only
`STRIPE_WEBHOOK_SECRET`. Set it through server environment/secret management;
the placeholder in `.env.example` is not a usable secret. This is the endpoint's
`whsec_...` signing secret, **not** `STRIPE_SECRET_KEY` (the API key). Use the
secret for the exact endpoint and environment. Dashboard-managed endpoints and
CLI listeners have different secrets; test and live endpoints also differ.
Never put it in frontend configuration, source control, request bodies or logs.

The app preserves the raw JSON body before shared parsing, retaining the existing
16 KB limit and rejecting compressed bodies to avoid transforming signed bytes.
The locked Stripe 17.5.0 SDK's `constructEvent` verifies the body/header/secret
and applies its default 300-second timestamp tolerance before returning the
event used by the existing billing switch. Missing/blank configuration returns
503; missing, invalid, stale or body-mismatched signatures return 400. Rejections
perform no database reads/writes or downstream Stripe calls. Responses are
generic; the webhook does not log signatures, SDK errors or event/customer data.
Other JSON routes retain normal parsing.

Required setup and deployment verification **remain pending**. Before enabling
deliveries in a separately authorized deployment, configure the correct endpoint
signing secret, confirm the deployed commit/runtime and HTTPS/proxy accessibility,
header/raw-body preservation, server clock accuracy, existing event subscriptions
and snapshot payload/API-version compatibility. Verify legitimate processing
using a designated Stripe test environment and confirm rejection of unsigned
and tampered requests without service effects. Record sanitized outcomes only.
No hosted setting or infrastructure was inspected or changed here, and no real
Stripe event was sent. A missing secret deliberately prevents webhook processing.

Signature verification does not provide duplicate-event handling, event ordering,
synchronization, retries/reconciliation, atomic writes, account-deletion versus
billing policy, or other lifecycle correctness. Existing swallowed failures,
uncaught async errors and placeholder billing fields remain deferred; existing
verified-event behavior is preserved. Backend/billing beta readiness is not
established. See [BACKEND_BASELINE.md](BACKEND_BASELINE.md) for remaining blockers.

References checked 2026-10-22: Stripe's [snapshot verification example](https://docs.stripe.com/events/set-up-events),
[Express middleware ordering and endpoint-secret guidance](https://docs.stripe.com/events/manage-webhook-endpoints#signature-errors),
[Node SDK signing/test headers](https://github.com/stripe/stripe-node#webhook-signing),
and [17.5.0 verification/timestamp implementation](https://github.com/stripe/stripe-node/blob/v17.5.0/src/Webhooks.ts).

---

The notes below are historical and include obsolete commands and the former browser EmailJS flow.

Start server: npm run sstart
Start client: pnpm run dev
Stat HTTPS forwarding: ngrok http http://localhost:8080
Start Stripe webhooks: {httpsUrl}/api/v1/payment/webhooks

- customer.created
- customer.updated
- customer.deleted
- product.created
- product.updated
- product.deleted
- customer.subscription.created
- customer.subscription.updated
- customer.subscription.paused
- customer.subscription.resumed
- customer.subscription.deleted

Test Login

- Enter email address
- If "invalid grant" error - reconnect Gmail service in MailJS

Confirmed Customer Lifecycle:

- Regitration through Stripe sessions
- Local DB creates customer through Stripe webhooks
- Daily subscription runs
- Customer can pause/resume
- WHAT HAPPENS WHEN CUSTOMER PAUSES?
  - Expected: upon next refresh, loses access to private tracks but can still log in
- If customer is deleted from Stripe Dashboard, DB updates accordingly and customer is logged out upon next refresh
