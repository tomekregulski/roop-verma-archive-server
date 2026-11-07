# Proposed six-account transition — 2026-11-06

**Superseded by owner clarification and accepted direction:** nobody has paid;
the accounts belong to owners/friends and may be recreated through the new
workflows. The current plan is
[TEST_ACCOUNT_RETIREMENT_REHEARSAL.md](TEST_ACCOUNT_RETIREMENT_REHEARSAL.md).
The earlier preserve/reconcile proposal below is historical, not a current
requirement for these six accounts. Targeted cleanup execution remains separate.

**Design only; owner policy approval and execution authorization are pending.**
This source-only task made no database/provider calls, retrieved no backup,
executed no migrations and changed no application/schema code. It preserves the
working tree and all existing migration/inspection bytes.

## Recommendation

Preserve all six app identities and their historical customer references while
performing a **one-time, case-by-case billing review**. Keep C1's existing guard
and the normal purchase/access/deletion composition. Do not infer a Stripe mode,
subscription, entitlement or disposable-test classification from the aggregate
findings. Do not add an automatic discovery, reconciliation or recovery system.

Resolve each case before activation through an explicitly approved, evidence-based
association or a safe unlink disposition. Unknown cases remain unresolved and
continue to block C1. This trades an up-front review of six cases for avoiding
a permanent legacy workflow and its ongoing maintenance.

This recommends neither deleting accounts nor making every account buy again.
An existing legitimate subscriber must be investigated before any new purchase
is offered. No refund, cancellation, compensation or account erasure is implied.

## What is established

[C1_REHEARSAL_RESULTS.md](C1_REHEARSAL_RESULTS.md) establishes six users and six
stored nonempty customer-ID fields in b004. The intermediate billing migration
created six associations with NULL mode; the cache migration left all six
unselected. All five removed tables were empty at the pre-C1 gate, and seven
other C1 guard counts were zero. Both selection predicates counted the same six
associations; this does not prove ownership mismatches or twelve affected users.

Unknown: who the users are, whether the references identify existing customers in
the intended Stripe account/mode, who controls those customers, whether current
subscriptions or pending purchases exist, and whether any account is a test.
No individual values or provider records were inspected. Empty local mirrors
are not evidence that Stripe has no financial obligations.

The earlier test-mode credential finding is dated metadata, not evidence of
each stored reference's mode or a license to probe live/test modes automatically.
No current deployment decision follows from the backup's historical state.

## Current source behavior and limits

| Capability | Current source behavior | Design consequence |
| --- | --- | --- |
| Identity/login | `identity/service.js` authenticates persisted sessions independently of billing and sends mailbox proofs for existing identities. | Keep IDs, login email, names, role and identity linkage. Do not recreate identities or grant roles during billing transition. Actual login still needs the separately gated identity schema/mail/deployment setup. |
| Paid playback | `billing/paid-access.js` validates exact ownership/mode before considering cache. Unknown mode throws; missing selection denies access. `playback/service.js` returns failure before signing private media. | Unknown association supplies no paid access, even if a display status appears active. Preserve D2/D10 cache bounds, paid evidence and terminal cancellation veto. |
| Account/Checkout | `billing/purchase.js` converts failed ownership/mode checks to help. A linked customer with no selected subscription also gets help. | No new Checkout, new customer or duplicate purchase merely to escape an unresolved legacy link. |
| Portal | Requires a customer binding matching the account and configured mode; a selected subscription is not independently required for Portal. | Preserve billing-management access after a binding is actually trusted. A raw legacy ID or mailbox match alone cannot authorize a Portal session. |
| Deletion request | D9 records the authenticated request without needing a trusted billing binding; completion requires closure review. Unknown mode blocks closure. | Do not erase or complete deletion to get past C1. Preserve requests/withdrawal and the approved closure checklist. |
| C1 migration | Requires every live linked association to have ownership, known mode and a selection. | Runtime fail-closed behavior does **not** make the unchanged migration pass. If one case remains unresolved, the current whole-database rollout remains blocked. |

No new product quarantine state is proposed. "Unresolved" here describes the
one-time operational review. Allowing unresolved links through C1 would be a new
migration/runtime contract requiring separate design and approval; it is not a
small guard removal hidden inside this proposal. Public playback remains public.

## Case outcomes and evidence gates

Use private case labels for six distinct source user IDs; retain exact references
only in an owner-approved protected case record. No identities/customer IDs,
emails, Stripe payloads or financial exports belong in repository documentation.
Mailbox proof establishes the app identity, not ownership of a Stripe customer.
Exact customer retrieval establishes that object's existence/mode, not who is
entitled to manage it. Email, old status strings and provider ID syntax are
insufficient on their own.

| Reviewed outcome | Proposed disposition | Required evidence / stop condition |
| --- | --- | --- |
| Correct customer ownership and one supported ongoing subscription are independently established | Preserve the identity/customer link; propose one exact, reviewed mode/selection assignment. | Owner-approved ownership evidence, designated Stripe account/mode, exact customer/subscription relationship, supported tier and duplicate/pending-purchase review. Uncertainty or conflicting ownership stops the case. |
| Correct ownership and a known ended subscription are established | Preserve the identity and propose retaining that exact ended selection where supported; normal subsequent Checkout can then make a new purchase. | Verify actual terminal outcome and all other obligations/attempts. A period-end cancellation scheduled for the future is not ended. Do not clear a terminal veto or promise free restoration. |
| No safe selection exists, and a complete bounded review establishes that unlinking cannot strand billing or permit a duplicate purchase | Preserve identity; propose a separately approved unlink to the existing unlinked-account shape. | Resolve known Checkout outcomes, subscriptions, schedules, pending invoices/retries and other relevant obligations. Preserve original reference/evidence under an explicit owner-approved custody/retention decision. A missing customer in one mode, empty list or unavailable provider is not enough. |
| Multiple ongoing subscriptions, unsupported arrangements, wrong/missing mode, disputed ownership, missing references or unresolved financial/purchase outcomes | Preserve current evidence and stop. | Owner/support investigation, and any financial disposition, is separate. No guessed selection, automatic retry/discovery, reassignment or new Checkout. |
| Owner believes an account is a test or wants it deleted | Keep the default until independently verified and separately authorized. | A test-mode key, unreleased-app status or no-real-subscriber report does not establish disposability. Explicit deletion follows D9/approved closure and retention, not migration convenience. |

The evidence review may conclude that none, some or all cases can transition.
This design commits to no per-case result and grants no access from case labels.

## Exact proposed write contracts — not approved or implemented

For either disposition, the future execution must reverify the current source,
freshness and identity of the exact reviewed records. b004 is evidence, not a
license to overwrite newer data. Writers must be coordinated under a separately
approved rollout. Use an exact reviewed case set and transactional account locks,
with compare-and-swap preconditions against retained source values. Any changed
reference, attempt, deletion/sync flag, tombstone or ownership conflict stops the
case; never broaden matching by email or substitute another customer.

**Association disposition:** setting mode/selection on a historical association
is a **backfill**, even when manual. The current no-backfill permission does not
allow it. It needs explicit new authorization naming the cases, evidence and
exact proposed values. Retain the original User ID/email/role and verified
customer reference. Enforce unique customer ownership and unique selection. Do
not set access-cache timestamps/paid coverage or financial fields to manufacture
entitlement. Clear stale cache stamps/coverage as required by the reviewed
transaction; never clear an existing terminal cancellation/deletion veto to
restore the same selection. Future playback must independently pass normal D2
evidence checks; assignment alone grants no paid access. Unexpected duplicates
remain a Dashboard/support decision under D8.

**Unlink disposition:** a concrete future transaction may set User.stripeId to
NULL and remove only the matching, migration-created BillingCustomer association
once ownership/obligations and evidence custody have been approved. This is an
explicit association/data disposition, not harmless cleanup. Require that the
association has no retained selection, cache, tombstone, attempt or unresolved
legacy flag that would be lost; separately verify there are no related historical
rows/closure evidence. Preserve the original reference in the approved protected
case record before removing the runtime link. Do not fabricate deletedAt or
stripeDeletedAt to make a guard pass. Keep the same identity, login mailbox,
admin role and application records. After the completed transition, existing
unlinked-account logic may offer a fresh owned Checkout; no paid entitlement
exists before a legitimate purchase. Retention duration/storage and any final
erasure remain owner decisions, not values invented here.

Neither transaction is supplied as SQL in this design: the exact permitted
record set and evidence do not exist yet. No generic rebinding endpoint, admin
entitlement editor, scheduled repair, provider-history worker or new financial
ledger is proposed. Do not repurpose D9's exact-session control to attach an
unowned legacy subscription; it only validates an existing owned attempt.

## Migration path and validation contract

1. Keep the existing 30 pinned migration files unchanged. C1 remains unapplied on
   the source; the intermediate rehearsal copy has been removed.
2. After case evidence and policy approval, prepare the exact one-time transition
   operations between migration 05 and C1, on a newly authorized isolated copy.
   These are separate explicit data operations, not a silently edited migration.
3. Test supported selection and safe unlink branches with synthetic providers and
   disposable PostgreSQL first. Add no runtime legacy mode unless a separately
   reviewed policy change proves necessary.
4. In a new authorized backup rehearsal, run the five intermediate migrations,
   apply only the separately approved case operations, and rerun **all nine**
   C1 guards. Any nonzero/NOT EVALUATED result stops before C1.
5. Only when those gates pass may the separately authorized rehearsal run final
   C1 and check retained identity/link counts, exact row preservation where
   approved, source/ledger hashes, removed objects and negative access behavior.
6. Production PostgreSQL compatibility, backups/recovery window, live rollout,
   provider configuration, mailbox delivery, HTTPS/cookies and media remain
   separately reviewed. A local pass authorizes none of them.

Acceptance must cover:

- The six identities cannot be deleted/recreated, merged by email, renumbered or
  granted roles by transition. Billing email changes cannot change login identity.
- Unknown mode/ownership/selection denies private playback without signing and
  cannot create Checkout/Portal sessions or silently become an unlinked buyer.
- Correct customer plus one independently approved exact selection passes normal
  purchase binding checks; no entitlement exists without current qualifying paid
  evidence, no trial/status-only access and no stacking/extended paid time.
- Safe unlink preserves the user and approved protected evidence; known/pending
  purchases, subscriptions, schedules, invoices, tombstones or ambiguous outcomes
  make unlink fail atomically. No second customer/Checkout is created by the
  transition operation itself.
- Terminal cancellation, owner deletion and immutable attempt/tombstone rules
  survive; D9 review cannot treat absence of local mirrors as billing closure.
- Concurrent/stale case evidence, wrong mode/account, duplicate ownership and
  provider errors stop without mutation, retry expansion or partial commits.
- A still-unresolved case keeps current C1 blocked. Existing nonempty legacy
  evidence/refusal tests and D1–D10 scenarios remain intact.

## Next bounded task and authorization boundary

The next useful task is **read-only case-evidence preparation/review**, not a
migration retry or a code change. Before execution, designate the Stripe account
and mode for investigation and the protected custody location. Prepare exact
field/request limits and the case-to-evidence mapping. Account/customer reference
lookup from a newly approved isolated backup and any exact provider/Dashboard
reads need their own explicit authorization. No cross-mode probing, broad event/
payment-history export or automatic provider action is included by inference.

The initial review should establish which case outcomes are supported and which
additional checks are necessary before an unlink or selection decision. A narrow
read-only first pass cannot, by itself, certify absence of every obligation.
Stop and propose the additional specific evidence scope if it is insufficient.
Owner-assisted Dashboard review is acceptable for the separately authorized
evidence collection.

Policy approval can adopt the recommendation to preserve all six identities,
keep unknown links fail-closed, prefer one-time verified dispositions and retain
the current C1 guard. It must remain distinct from authorizing record access,
backfill, unlink, retention storage, financial actions, implementation or rollout.
No account details or final dispositions are needed to complete this design.
