Subsequent D1/D8 local integration is also authorized and implemented; current
handoff: [STRIPE_LED_PURCHASE_IMPLEMENTATION.md](STRIPE_LED_PURCHASE_IMPLEMENTATION.md).
Normal runtime and provider settings remain unchanged. This document retains the
completed first slice's original boundaries/evidence.

# Local first implementation brief — authorized 2026-11-01

Owner explicitly authorized only this slice after D1–D10 approval. It is now
implemented and locally verified; see [PAID_ACCESS_IMPLEMENTATION.md](PAID_ACCESS_IMPLEMENTATION.md).
All exclusions and the stopping point below remain in force. Broader transition,
normal-runtime cutover and provider changes are not authorized.

## Outcome

For an **already trusted account/customer/selected-subscription binding**, implement
one small Stripe-led access adapter: qualifying current paid interval → finite
shared cache → playback decision, with a terminal cancellation veto. Verify it
through actual HTTP playback with fake delivery and disposable PostgreSQL.
Estimated **4–6 active engineer hours**, included within transition package A's
9–14h, not additional and not a promise of model/tool wall-clock duration.

## Dependencies / approval gates

- Read `AGENTS.md`, `STRIPE_LED_DECISIONS.md` and
  `STRIPE_LED_D10_RECOMMENDATION.md`. D1–D10 and this local slice are approved.
- Owner approved the 15-minute maximum cache, no stale-if-error behavior, terminal
  cancellation veto and resulting outage/existing-media-URL limits. That approval
  does not authorize work outside this brief.
- Current backend changes are uncommitted. Preserve them and unrelated changes;
  no reset, blanket deletion or history rewrite. Keep Stripe 17.5.0 / Acacia,
  Prisma 4.12.0 and the existing package manager/dependencies.
- Bindings in this slice are trusted fixture setup, not invented payment grants.
  No automatic selection from legacy status strings, email or arbitrary Stripe
  customer events. Signup/Checkout production binding cutover is a subsequent task.

## Scope

1. Define the minimum selected-binding state and one discardable cached paid
   interval/freshness snapshot in the existing PostgreSQL boundary. Add only the
   local schema/migration support necessary for this slice; validate in disposable
   databases. No shared-data backfill or destructive ledger cleanup. If application
   of any existing migration elsewhere is uncertain, preserve it and document the
   later forward migration/cutover dependency.
2. Reuse existing config/SDK and simple evidence helpers to retrieve the selected
   subscription and latest paid invoice, scoped to its customer. Qualify approved
   price/product/mode, automatic collection, positive non-credit/non-discount
   payment, complete matching recurring line, and current original service period.
   No PI/charge/refund/dispute reads or historical scans. Return the existing
   normalized interval shape; status alone is never authority.
3. Implement shared positive caching with freshness anchored before provider reads
   and clipped to paidThrough. Recheck current account/binding/terminal veto on
   every evaluation. Expired/cold cache + provider failure yields unavailable;
   errors/hits cannot extend freshness. Coalesce concurrent refreshes per process,
   with conditional writes rejecting stale-binding/older-fill results. No leases,
   scheduled refresh, long negative cache or new service.
4. Implement a narrow handler behind the existing signature/envelope verification:
   a matching terminal subscription-deleted event persists the selected-subscription
   cancellation veto before acknowledgement. Duplicates are harmless; an old
   subscription cannot affect a replacement. Paid/updated/refund/dispute events
   cannot clear it. A provider-read canceled status sets the same veto. This is
   blocking-only; it never provisions an account or grants paid time.
5. Exercise the actual playback service/HTTP route using the new adapter and real
   local identity/DB binding, with synthetic Stripe resources and fake signer.
   Preserve the public path, private mapping restrictions, no signer on denied
   access, exact interval bounds and final local veto check after delayed mapping.

## Acceptance evidence

- Qualifying paid subscription issues a fake private URL; active-but-unpaid,
  trial/free/credit/discount/wrong-owner/wrong-mode/unsupported inputs do not.
  Late payment grants only the original remaining period. Failed renewal adds no
  time. Refund-only does not revoke; canceled does, under D3–D5.
- Cold fill normally makes two Stripe GETs; repeated requests within freshness
  and the second playback reader evaluation use the snapshot. Count actual calls.
  Delayed mapping past freshness requires refresh, not reuse of stale authority.
- Boundary expiry, slow fills, cache hits, provider failure and process restart
  never extend freshness or paidThrough. Fresh cache can survive Stripe failure;
  expired/cold cache cannot. Public playback never calls Stripe.
- Signed cancellation during asset mapping vetoes the final signer despite a
  cached positive result. Failure to persist cancellation is retryable. Duplicate
  events and old-subscription events cannot unblock or corrupt the current binding.
- Independent DB clients prove that a cancellation/deletion/binding change wins
  over an in-flight fill, and a late older fill cannot overwrite a newer result.
  A missed cancellation event resolves after cache expiry when Stripe is reachable;
  provider failure after expiry issues no new URL.
- Keep existing identity/ownership/signature/catalogue protections. Run relevant
  synthetic checks and the disposable PostgreSQL checks; keep the separate known
  NetworkError.errorCode nullability diagnostic visible, unchanged and unsuppressed.

## Boundaries and stopping point

- **No normal-runtime cutover yet.** Demonstrate the new real adapter in the isolated
  HTTP/DB fixture. Current provisioning/webhook/financial paths stay intact until
  the next integration task can replace them coherently. Do not ship two competing
  playback authorities or present old fixture results as proof of the new one.
- Exclude signup/Checkout frontend/backend rewiring, owner-facing deletion/recovery
  controls, old ledger/schema removal and reconciliation-CLI retirement from this
  first slice. They remain necessary subsequent A/B work, not forgotten scope.
- No frontend implementation is authorized by a backend-only approval of this brief.
  Any client contract work needs explicit authorization in the subsequent brief.
- No provider API/settings, existing/remote database, remote migration, deployment,
  infrastructure, real email/media delivery, restoration, push or merge. Test
  fixtures supply resources and bindings, never an entitlement decision.
- Finish with code/file map, local results, observed GET counts and unresolved
  integration dependencies. Stop before broadening scope or enabling runtime use.
  Local success is not a launch, billing-provider or private-media guarantee.
