# Isolated Stripe-led paid-access slice — 2026-11-01

Subsequent local D1/D8 integration now supplies a trusted binding through owned
Checkout; see [STRIPE_LED_PURCHASE_IMPLEMENTATION.md](STRIPE_LED_PURCHASE_IMPLEMENTATION.md).
The adapter code and normal runtime selection remain unchanged.

The owner approved D1–D10 and authorized only the local scope in
[STRIPE_LED_FIRST_IMPLEMENTATION.md](STRIPE_LED_FIRST_IMPLEMENTATION.md).
That slice is implemented with fake Stripe/mail/media and disposable PostgreSQL.
**Normal runtime still uses the old billing engine. No cutover occurred.**

## Code map

| File | Responsibility |
| --- | --- |
| `billing/paid-period.js` | Pure D2 qualifier: approved subscription and one positive paid invoice/recurring line → original remaining paid interval. Reuses existing tier/date helpers. |
| `billing/paid-access.js` | Shared cache, per-process coalescing, current ownership checks, conditional fill writes and the terminal cancellation veto. No runtime import or background work. |
| `prisma/migrations/20261101180000_paid_access_cache/migration.sql` | Forward-only nullable selection/cache columns and SQL consistency/freshness/unique-selection constraints on BillingCustomer. No backfill, invented selection or old migration edits. |
| `test/support/paid-access-http.js`, `paid-access-cases.js` | Isolated composition through actual identity, playback HTTP route, raw signature verifier and recording fake signer. Fake resources, never a supplied entitlement decision. |
| `test/paid-access.test.js`, `test/integration/paid-access.postgres.js` | 44 shared cases plus nine PostgreSQL-only checks using independent Prisma clients and SQL failures/constraints. |

## Behavior

- The adapter accepts an already trusted customer binding with one selected
  subscription. Selection/provisioning is deliberately not implemented here.
  The migration leaves existing selections/cache columns NULL. No status string,
  arbitrary customer event or provider email creates that association.
- A miss retrieves the exact selected subscription, then lists one most-recent
  paid invoice scoped by customer and subscription. Unexpected latest evidence
  fails closed; no pagination/historical search or PI/Charge/refund/dispute reads.
  The complete matching recurring line supplies the service period. A positive
  invoice plus correct lifecycle/tier/mode is necessary; active status is insufficient.
- Only `[max(line.start, paid_at), line.end)` can authorize. No trials, zero-cost,
  discount, pre-payment credit/out-of-band settlement, unsupported adjustments or
  unpaid grace. A refund alone does not revoke. Post-payment refund notes do not
  undo the original payment; credit used to settle an unpaid invoice is rejected.
  Stripe documents both uses of credit notes separately in its
  [credit-note guide](https://docs.stripe.com/invoicing/dashboard/credit-notes).
- Freshness starts before provider reads and ends at the earlier of 15 minutes or
  paidThrough. Hits/restarts/errors never slide it. DB rows hold a paid interval
  and timestamps, not a financial ledger, tokens or media URLs. The cache key
  includes policy/configuration and exact user/customer/subscription selection.
- Every evaluation reads current local ownership and deletion/cancellation state.
  Pending deletion does not revoke existing coverage. Completed deletion, changed
  selection or terminal cancellation defeats a suspended fill and final signing
  check. Writes are conditional; older fills cannot overwrite newer snapshots.
  Equal read-start timestamps do not overwrite an already committed result.
- Verified matching `customer.subscription.deleted` adds a terminal veto before
  acknowledgement. Persistence failure is retryable. Duplicate/old notifications
  cannot clear it or affect a replacement. The same veto is stored if a refresh
  observes canceled status. Refund/dispute/paid/updated events grant or restore
  nothing in this narrow handler. There is no event-history/reconciliation engine.
- Fresh shared rows survive a new adapter/client and provider failure. Cold/expired
  rows fail unavailable when Stripe fails; DB uncertainty also fails closed.
  Missing cancellation events resolve on cache expiry. Existing two-hour URLs are
  unchanged; no provider call or cached check can recall delivered bytes.

The injected Stripe client must keep the existing API pin, timeout and retry
bounds. Tests use the real webhook signing library offline. Real Stripe behavior,
latency and read-allocation capacity still need separately authorized verification.

## Verification and observed provider requests

Node 24.19.0, Stripe 17.5.0 / Acacia, Prisma 4.12.0; dependencies/lockfile unchanged.

| Check | Result |
| --- | --- |
| Full synthetic regression, `node --test test/*.test.js` | **290 pass**: existing 246 plus 44 isolated-access cases |
| Full disposable PostgreSQL, `npm run test:billing:local` | **144 pass**: earlier 91 plus 44 shared access cases and nine new SQL/client checks |
| Separate strict schema assessment | **6 pass, 1 fail**: only existing NetworkError.errorCode Required→Nullable drift; unchanged and unsuppressed |
| Prisma validation, syntax (155 JS files), formatting, diff whitespace | Pass |

SQL checks include full migration replay; prior-schema upgrade/redeploy retains
unselected bindings; shared reuse from a second client; cancellation, deletion and
selection changes during a suspended HTTP fill; older positive results losing to
newer positive/denied results; write-failure acknowledgement/rollback; uniqueness
and finite snapshot constraints. These are real DB checks, not the memory double's
serialization. Historical billing-policy tests still exercise the old isolated
engine; they do not establish that the new adapter preserves superseded policies.

| Isolated observed scenario | Stripe GETs |
| --- | ---: |
| Cold successful HTTP issuance, including final signing recheck | **2**: subscription retrieve + scoped paid-invoice list |
| Eight additional hot HTTP issuances | **0 additional** |
| Public issuance | **0** |
| Ten concurrent same-process cold reader calls | **2 total** |
| New adapter / second Prisma client reusing a fresh shared row | **0 additional** |
| Terminal cancellation received through signed HTTP webhook | **0** |
| Missed cancellation discovered on expired-cache refresh | **1**, then persistent veto |
| Mapping crosses the 15-minute cache boundary | **4 total**: justified refresh before signing |
| Fresh cache during provider outage | **0** |
| Cold/expired cache with failed first provider read | **1 failed attempt**, no URL |

These are fake-provider call counts asserted by tests, not measured live traffic.
No API request follows a financial relationship to payments/charges/refunds/disputes.
Cross-process simultaneous expiry can still duplicate a bounded fill; no distributed
lease was added. Denials have no long-lived negative cache.

Reproduce with the supported Node runtime and installed optional embedded PG tool:

```sh
node --test test/paid-access.test.js
EMBEDDED_POSTGRES_MODULE=/absolute/path/embedded-postgres/dist/index.js npm run test:paid-access:local
EMBEDDED_POSTGRES_MODULE=/absolute/path/embedded-postgres/dist/index.js npm run test:billing:local
```

The runner creates/stops/removes a new loopback cluster; direct DB commands reject
non-disposable targets. It never uses a configured application/remote database.
No normal application startup or production provider client was executed.

## Remaining integration dependencies — not authorized by this slice

1. D1/D8 account-before-Checkout provisioning and durable owned-session association
   must select a subscription securely. A replacement must atomically clear the
   previous snapshot/veto. Unresolved old Checkout outcomes remain a separate narrow
   recovery task; no arbitrary identifier/email rebind is permitted.
2. Review whether migrations have been applied anywhere shared before any schema
   removal/amendment. This slice only added a forward migration and applied it to
   fresh disposable schemas. No existing/remote DB was read or changed.
3. Update account/client contracts, then deliberately connect the new adapter and
   terminal handler in normal runtime. Currently only test composition selects it;
   old signup, webhook processing, display, playback runtime and financial engine
   remain intact. Move the reused simple helpers when retiring that engine later.
4. Implement the required owner-facing deletion/completion and known-purchase
   recovery controls and runbooks; no routine SQL/engineer task may be disguised
   as an owner duty. D9 response-time/retention follow-up is still separate.
5. Separately authorize Stripe configuration/test-mode validation, actual envelope
   version, fixed tier/mode/card settings, Portal/recovery/cancellation workflows,
   dispute limitations, real latency/read counts and operational notices.
6. Retire superseded engine/schema/reconciliation paths only with a coherent
   approved integration. Media mapping/private delivery, public-URL retirement,
   deployed verification and restoration remain separate. No frontend edits,
   runtime cutover, owner UI, provider settings, deployment, push or merge occurred.

Scope stayed within the authorized first slice. The 4–6 hours remains a planning
estimate of engineer working time; this run did not measure human engineering
labor. Tool/test execution time is not a claim that the whole transition is done.
