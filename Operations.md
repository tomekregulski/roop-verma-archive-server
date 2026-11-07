# Current Stripe-led operations — C1 local consolidation, 2026-11-02

**Owner hold — 2026-11-07:** preserve the completed rehearsal evidence, indexed in
[REHEARSAL_EVIDENCE_INDEX.json](REHEARSAL_EVIDENCE_INDEX.json). Account deletion
and listening telemetry are being revised; error storage/payment qualification
may also change. Do not proceed to live cleanup, migration or rollout. Review the
final target schema and migration sequence after those decisions, then determine
the necessary fresh local checks/rehearsal. The prior PASS applies only to its
recorded snapshot and sequence; the older operational steps below are not current
execution instructions. No source-data, provider, schema or migration action is
authorized by recording this hold.

Normal backend/frontend composition selects purchase, paid access and owner-assisted
account deletion. Stripe owns Checkout, Portal, recurring billing and configured
recovery. Owners use Dashboard/support for rare financial exceptions. There is
no reconciliation CLI, daily application reconciliation, grant/financial-history
repair, generic operation recovery sweep or receipt-log monitoring procedure.
[BILLING_API.md](BILLING_API.md) maps the one normal path; current verification and
reduction are in [STRIPE_LED_PURCHASE_IMPLEMENTATION.md](STRIPE_LED_PURCHASE_IMPLEMENTATION.md).
No real provider, existing database, deployment or private delivery was exercised.

## Activation dependencies — separately authorized work

- Preserve reviewed D1–D10 settings: one positive monthly card tier, no trial/
  discount/credit arrangements; Checkout return URLs, Portal period-end cancellation,
  recurring recovery and supported dispute cancellation configuration. Verify the
  pinned Stripe 17.5.0 / Acacia request, expansion, event and retry shapes in a
  designated real test environment. Local fakes establish none of those settings.
- Supply DATABASE_URL and separately disposable shadow URL only under authorized
  deployment procedures; API_KEY, CLIENT_URL, AUTH_RATE_LIMIT_SECRET, cookie/proxy
  settings, Stripe API key, endpoint-specific STRIPE_WEBHOOK_SECRET, explicit
  BILLING_PRICE_ID / BILLING_PRODUCT_ID / BILLING_CURRENCY / BILLING_LIVEMODE,
  RESEND_API_KEY and LOGIN_EMAIL_FROM. See `.env.example` / `IDENTITY_API.md`.
- Owner must supply ACCOUNT_DELETION_SUPPORT_EMAIL; no recipient is inferred from
  EmailJS or invented. Verify sender/inbox behavior separately. Missing/uncertain
  mail does not erase a saved request; inspect the protected pending list.
- Establish the intended owner's verified persisted identity/current isAdmin role
  through a separately approved process. `/owner/deletions` is now normally routed;
  frontend development AdminLogin does not supply authority. Agree support contact,
  response expectations and applicable retention policy; no SLA is promised.
- Complete the existing-data preflight below before migration/activation. Stop old
  writers and coordinate schema/client rollout; the new generated client requires
  the complete forward schema. Do not run new code on an unmigrated database or
  old provisioning/recovery beside new deletion. No mixed-version deployment is verified.
- Actual media mapping/signing, public-URL retirement, streaming/expiry verification,
  deployed HTTPS/proxy/cookies, restoration and launch approval remain separate.

## Existing-data preflight and retention blockers

The explicitly authorized 2026-11-07 isolated cleanup/migration rehearsal
**passed**: [TEST_ACCOUNT_RETIREMENT_RESULTS.md](TEST_ACCOUNT_RETIREMENT_RESULTS.md).
Six local test users were retired; no matching auth/listening rows existed.
Archive content stayed unchanged, all nine C1 guards were zero and all six
migrations completed with 30 checksum-matched ledger entries. The temporary
copies were removed. This is local snapshot evidence, not live cleanup or rollout
approval. Fresh signup/verified-owner admin provisioning remain separately gated.

Owner clarified that nobody has paid and the six legacy accounts belong to
owners/friends, and accepted retiring them for fresh workflow testing. The
[targeted test-account retirement plan](TEST_ACCOUNT_RETIREMENT_REHEARSAL.md)
supersedes the earlier preserve/reconcile proposal for those accounts. Cleanup
was executed only on the isolated copy as recorded above; any live cleanup or
rollout remains separate. No live deletion occurred; archive content and media
stay preserved.

The subsequent owner-authorized local rehearsal completed on 2026-11-06:
[C1_REHEARSAL_RESULTS.md](C1_REHEARSAL_RESULTS.md). Six historical users produced
six mode-unknown, unselected associations after the five intermediate migrations;
both C1 selection guards counted six. Final C1 was not run, and every temporary
copy was removed. Account-transition policy/design is now the concrete blocker;
no association/selection/retention change or deployed migration is approved.

The owner-authorized 2026-11-06 isolated b004 inspection is recorded in
[C1_PREFLIGHT_RESULTS.md](C1_PREFLIGHT_RESULTS.md): historical Subscription and
WebhookLog are empty, but newer billing/identity schema is absent and C1's full
transition is not yet verified. The copy was removed. Current live contents and
trusted-association disposition remain unknown. Any further backup access or
migration rehearsal needs separate authorization; decide disposition from the
separately reviewed evidence:

| Removed structure | Required condition / treatment |
| --- | --- |
| CheckoutOwnership | **Zero rows**. Every row, even one matching an attempt, blocks migration. Investigate exact ownership/Checkout closure first; never erase unresolved evidence to bypass D9. |
| Historical Subscription and PaidInvoiceGrant | **Zero rows**. Owner-approved retention/disposition is required for any historical mirror/grant; no financial selection or conversion is inferred. |
| StripeEventReceipt and WebhookLog | **Zero rows**, including applied/ignored receipts. Owner must decide audit retention/disposition; pending/review outcomes need investigation. |
| BillingOperation | Keep owned immutable v2 Checkout attempts and deleted security tombstones. Registration, old parameter formats or live orphan attempts block migration; do not rewrite/scrub live parameters or assign ownership. |
| BillingCustomer legacy flags | No deletionRequestedAt, syncIssueCode or reconcileCursor evidence. Investigate flags, keep terminal stripeDeletedAt/deletedAt tombstones, and resolve pending requests without silently losing them. |
| Trusted selection | Every live association must have exact matching User/customer ownership, known mode and a securely established selection. No selection backfill exists. Ambiguous emails/associations or unsupported arrangements require owner/engineering review. |
| Removed metadata | User.subscriptionActive is display-only; BillingCustomer revision, lastSyncedAt and lastFullScanAt are obsolete old-engine coordination timestamps/counters. Their removal does not grant access. |

The migration locks affected tables, checks these conditions, and drops only empty
legacy tables. It does not delete legacy rows, export/archive them, choose a
retention period, reassign ownership or reconstruct history. Populated fixtures
prove refusal/rollback, not compatibility with unknown existing records. Owner
retention decisions and any supported-data investigation are concrete blockers to
applying this migration if those cases exist. Resolve them in separately scoped,
reviewed work before activation; do not disable the guards. Prisma 4 may mask a
transactional refusal as `current transaction is aborted`; the DO precondition
block can be checked independently in the separately authorized disposable copy.
Never repeatedly apply a failed migration to an existing DB or manually mark it
applied to bypass review. Historical migration files remain unchanged.

## Owner-assisted deletion

A customer explicitly requests deletion in Account. This blocks new
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

Completion atomically deletes User, all sessions/login links,
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
existing expiry). Late callbacks cannot recreate identity or associate
retained billing with a later same-email account. The old provisioning/recovery paths have been removed by C1.

## Financial exceptions and outage behavior

Customers cancel at period end in Portal and keep their paid remainder. An actual
canceled subscription vetoes new paid playback. For refund-only, explicitly leave
renewal/access unchanged; refund-and-end-service requires explicit immediate
cancellation plus refund in Dashboard. Partial refunds, unsupported disputes,
duplicates and agreed compensation are owner/support work. Won/withdrawn disputes
do not restore canceled access/time automatically; an agreed new purchase charges
again. No app cancellation, refund or restoration endpoint exists.

A cold/expired access cache fails closed during Stripe or DB outages. Valid cache
hits remain usable only to their fixed deadline; errors/retries never extend it.
For uncertain purchases, reuse only the owned same-key attempt within its safe
window; old unknown outcomes stay at help for exact investigation. Do not create
another Checkout key or guess by email to clear a blocker.

## Webhook authenticity and verification

`POST /api/v1/payment/webhooks` consumes original raw JSON before shared parsing,
with the existing 16 KiB limit and compression rejection. Configure the exact
endpoint/environment's signing secret, separately from the API key. The SDK
verifies bytes/header and default timestamp tolerance before dispatch. Missing
secret is 503; missing/invalid/stale/tampered signatures are 400 with no service
work. Do not log credentials, signatures, provider bodies or private media URLs.

Separately verify deployed HTTPS/proxy/header preservation, clock, snapshot/API
version, subscribed `checkout.session.completed` / `customer.subscription.deleted`
events and genuine payload sizes. Unknown notifications do no provisioning or
ledger work. Cookie ownership, signed events and provider email are distinct
trust boundaries. Existing paid-invoice verification, cache/veto, final playback
checks and transactional tombstones remain necessary.

## Local checks

Use compatible Node 24.19.0 and generated Prisma 4.12.0 client. See
[test/README.md](test/README.md) for synthetic/disposable PostgreSQL/browser commands.
The strict schema diagnostic deliberately retains the unrelated telemetry
nullability failure. Local checks never prove real delivery, launch readiness or
the zero-routine-engineering / roughly five-hours-per-quarter target.
