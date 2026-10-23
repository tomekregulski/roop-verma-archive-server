# Current integration handoff — browser identity, 2026-10-22

The owner authorized frontend implementation and narrowly necessary backend fixes. The React email-proof/session flow now works against the isolated local backend. Frontend base HEAD: `baefaf4ddf8d2f0797cbf8073fb18e861b9b79a7`; backend base HEAD: `f6a91da98a7b21ac7745bb9441b151afa9b17b01`, with uncommitted changes in each separate repository. No backend application code, dependencies or migrations changed here: only `test/support/browser-fixture.js` and handoff/contract documentation. Verification results, historical source fingerprints, reproduction steps and limits are recorded in the sibling frontend's `IDENTITY_HANDOFF.md`. Local test captures are ignored and are not required to read that handoff or run the tests.

Server-only email initiation, single proof exchange with immediate URL scrubbing, cookie restoration, credentialed CSRF requests, current account identity, ownership-compatible portal/Checkout, server logout and 401/expiry/revocation recovery were exercised in an actual browser. Frontend type-check/build/lint and three proof-capture regression tests pass. The browser assertion page passed 18 allowed-origin checks; a separate wrong-origin check reported a pass, but accepts any network failure and therefore needs a reachability control before being treated as conclusive CORS evidence; browser UI checks covered login/reload, invalid/expired/reused proofs, logout, revocation and expiry. Backend `npm test`: 70 passed on available Node v26.3.0, after permitting loopback binding. Real PostgreSQL checks were not rerun; historical schema-drift failure remains open. No backend application fix was needed.

Registration now waits for email verification before Checkout. It makes at most three generic login requests over 40 seconds, then exposes manual retry/help. A ten-second delayed, signed synthetic customer.created event was followed through login, owned Checkout creation and return. Missing-webhook behavior stops without mail/session/Checkout. There is no public readiness endpoint: provisioning or email failure cannot be distinguished by the client. Webhook failure/reconciliation remains a blocker to guaranteeing real registration completion; no billing lifecycle guarantee was added.

All providers and storage were fake; test-only mail/clock/control surfaces are confined to the standalone harness and never mounted by app.js/index.js. HTTP uses `rv-session-local`, HttpOnly/SameSite=Lax. This does not test the production Secure `__Host-` cookie, HTTPS/proxy behavior or cross-site third-party-cookie restrictions. Intended HTTPS shared-site frontend/API domains, exact CLIENT_URL/CORS, proxy/runtime configuration, mail setup, signing-secret deployment and separately authorized provider/deployment verification remain required. No real email, Stripe test/live requests, production data, remote migrations, DNS or hosting settings were touched.

Local browser identity integration is verified. Real email delivery, deployed behavior, billing lifecycle, media entitlement, catalog/admin authorization, schema drift and other documented blockers remain unresolved. This is not beta readiness. Earlier statements below that frontend changes were unauthorized or browser integration unverified are historical, superseded only within this bounded local outcome.

---

# Current backend handoff — webhook authenticity, 2026-10-22

**Bounded outcome:** `POST /api/v1/payment/webhooks` now preserves the raw body
before global JSON parsing and uses Stripe SDK `constructEvent` with
`Stripe-Signature` and server-only `STRIPE_WEBHOOK_SECRET`. Only the verified
event reaches the existing billing switch. Missing/blank secret returns 503;
missing/invalid/stale/body-mismatched signatures return 400 before any database
read/write or downstream Stripe call. Webhook payload/customer/error logging
was removed; existing billing operations and acknowledgement behavior remain.
Official Stripe documentation and the locked 17.5.0 SDK behavior were checked.

**Local evidence:** `node --test test/stripe-webhook.test.js`: **19 passed**.
`npm test`: **70 passed** (all 51 existing synthetic checks plus 19 new checks),
on available Node v26.3.0/npm 11.16.0. The actual app middleware composition is
used with real offline SDK signature verification, a test-only secret and fake
database/Stripe services. Valid events prove expected stored customer fields
and deletion; rejected requests prove zero service calls and unchanged storage.
Ordinary JSON registration still passes parsed fields to fake Stripe. This does
not establish Node 26 compatibility for real startup or providers. Pinned Node
24.19.0 was unavailable; earlier local PostgreSQL/schema results were not rerun.
All five changed/new JavaScript files passed `node --check`; `git diff --check`
passed. A source comparison confirmed the existing billing switch is unchanged
beyond removal of logging. The initial sandbox test attempt could not bind
loopback; the permitted rerun produced the passing HTTP results above.

**Still required:** configure the correct endpoint/environment signing secret
through server secret management, then separately verify deployed reachability,
HTTPS/proxy/header/raw-body behavior, clock accuracy, deployed runtime and
snapshot event/API-version compatibility, and designated test-mode delivery and
rejection outcomes. Deployed accessibility remains unknown. No production data,
real Stripe events, hosted webhook settings, infrastructure or remote migrations
were accessed or changed. See [Operations.md](Operations.md) and `.env.example`
for setup using placeholder values only.

**Remaining ranked blockers:** #2 authenticity is enforced and locally tested;
deployed enforcement is unverified. #1 is not fully closed: catalog/admin
mutations and browser/deployed identity integration remain open despite completed
local identity/account guards. #3 private audio/media entitlement remains open.
#4 duplicate-event handling, ordering, synchronization/retries/reconciliation,
partial writes and account deletion versus billing, plus other lifecycle concerns
remain explicitly deferred. Existing swallowed failures, async error handling,
null-name/payload compatibility and placeholder billing fields are unchanged.
#5 safe deployment/operations, runtime/provider checks and the known
NetworkError.errorCode schema drift remain open. Registration email enumeration
also remains open. Signature verification does not establish lifecycle correctness
or backend/billing beta readiness. Preserve the historical ranked assessment below.

## Prior backend identity handoff — 2026-10-17

The owner approved the backend design checkpoint: Resend server delivery, 15-minute single-use proofs, seven-day revocable opaque-cookie sessions, authenticated account ownership including portal/payment routes, persisted Checkout ownership, and a future shared-domain browser arrangement. Frontend edits, DNS/hosting changes, production data and remote migrations remain unauthorized.

**Implemented locally:** email-proof/session lifecycle; hashed database storage; transactional one-time consumption and browser-session rotation; current identity and server logout; public-key/admin and account-update bypass replacement; self/admin account guards; permanent testing-only bulk-delete removal; CSRF/CORS, validation and shared database abuse counters; server-derived Stripe customers and pre-Stripe ownership checks. See [IDENTITY_API.md](IDENTITY_API.md) for the contract, configuration names, manual curl/Postman walkthrough, and remaining frontend work.

**Evidence:** the baseline was reproduced on Node 24.19.0 (2 smoke passed; 8 security assertions failed). Current synthetic regression suite: **51 passed**, including all eight original assertions and an automated curl walkthrough. Independent identity assessment: **8 passed**. Real PostgreSQL 18.4/Prisma 4.12 identity suite: **6 passed**, including 24 concurrent HTTP exchanges with exactly one winner, rollback on session-insert failure, expiry/logout/cascade, atomic rate counters and persisted Checkout ownership. Fresh replay of all 25 local migrations and repeated deploy are successful. Prisma schema validation/client generation, all 123 JavaScript syntax checks and git diff --check passed. Mail and Stripe remain fake in every automated HTTP test.

**Additional assessment still fails:** strict full-schema comparison reports NetworkError.errorCode required in migration history versus nullable in the pre-existing Prisma model. No identity-table drift is reported. The strict no-drift assertion remains separately runnable as `npm run assess:schema:local` (6 passing identity checks plus 1 failing full-schema check, nonzero exit). Telemetry schema repair is outside identity scope; passing identity checks are not a clean whole-schema assessment.

**Limits and blockers (at that handoff):** no real email sent; provider account/sender setup and an explicitly designated test inbox are pending. Browser/frontend integration, shared-domain setup, deployment/proxy behavior, real Stripe calls, existing/production data and remote migrations remain unverified. Unsigned webhook corruption was unresolved then; see the 2026-10-22 local authenticity fix above. Private audio/media entitlement, catalog/admin mutations and subscription synchronization remain open. Registration still distinguishes existing addresses. No complete-priority-#1 or beta-readiness claim is warranted. New additive schema is local/test-verified only; deployed migration history/readiness must be reviewed separately.

**Next session:** learning/review of the backend flow and walkthrough, then separately authorized frontend integration. Preserve the ranked assessment below as historical evidence and remaining backlog, not a description of current login behavior. See `test/README.md` for commands and verification boundaries. The frontend worktree remains unchanged.

---

## Deferred backlog

### Test readability and organization pass

- **Status and priority:** deferred maintainability work. Schedule as a separate, focused task after the learning/review session, using that session to identify unclear areas. This does not displace unresolved security blockers or change their priority.
- **Scope:** improve test and variable names, group related tests, split cases covering independent behaviors, and consistently use Arrange → Act → Assert.
- **Acceptance:** preserve all security assertions and behavior coverage; rerun affected tests and record results and verification limits. Do not weaken assertions or change application behavior as part of this task.

## Historical assessment and original preparation proposal (superseded where noted above)

# Backend baseline — 2026-10-17

Status: assessment and local HTTP test foundation only. The earlier temporary identity containment was withdrawn at the owner's request; original application behavior is restored. No security blocker is fixed by this branch. Authentication, authorization, and Stripe integrity issues remain open. No real subscribers exist per owner; the application is unreleased, but deployed reachability/access restrictions have not been established. No production data accessed, deployed credentials loaded, remote migrations run, or infrastructure changed.

Constraints: one engineer, 2–4 hours/week, beta in roughly 3–4 months; development budget $10–15/month and launch target under $30/month. Prefer small fixes to the existing stack. PNPM, TypeScript conversion, monorepo, hosting migration, broad dependency upgrades, and general cleanup are deferred unless evidence makes them necessary. This is a focused baseline, not a complete security audit.

## Current branch handoff — assessment and test foundation, 2026-10-17

**Final outcome:** no application behavior changes. The temporary 403 responses and disabled token implementations were removed after the owner clarified the preferred development model. Login/token issuance, user lookup/listing, and both deletion routes retain their original behavior and known vulnerabilities. The testing-only delete-all route is also unchanged; its removal should be an explicit bounded change. Do not describe this branch as containment, secure login, or a blocker fix. Earlier 35-test containment results describe a withdrawn implementation and are not current acceptance evidence.

**Working model:** prioritize small, complete functional improvements while the app is unreleased and has no real subscribers. If a functional fix cannot fit, finish assessment, synthetic reproduction tests, and a concrete implementation plan. Do not disable development flows simply to fit a session. Consider containment when exposure is established or the owner explicitly chooses it. Unreleased does not establish private network access: confirm sanitized reachability/access-control metadata with the owner before using exposure as the reason for shutdowns. No production inspection is authorized here.

**Test commands and interpretation:**

- `npm test`: passing HTTP harness/smoke checks only. These mount the actual auth/user routers with Express on an ephemeral loopback port, synthetic Prisma/Stripe doubles, synthetic JWT configuration, suppressed controller logs, and dotenv loading disabled. This checks the fixture wiring and synthetic registration path; a green result does **not** establish secure authentication or real-service compatibility.
- `npm run assess:identity`: separate desired-security assertions against the current real routers. Expected to exit nonzero while the known vulnerabilities remain; failures are not skipped, marked TODO, or inverted into passing assertions of insecure behavior. Covers direct email-token disclosure, exchange into a session, public-key admin issuance, the account-update bypass, user enumeration/customer lookup, and single/all-user deletion. Failures print neither credentials nor account payloads. These are initial reproduction tests, not a complete future acceptance suite. Keep this command explicitly separate from the passing checks; when each vulnerability is fixed, move its passing security contract into the regular regression suite. Do not make the regular checks green by weakening security assertions.
- Both commands require a compatible runtime and loopback binding. Node v24.19.0 is locally available and verified for these tests. Node v26.3.0 cannot load the locked JWT dependency (`buffer-equal-constant-time` references removed `SlowBuffer`). Runtime pinning/dependency compatibility remains open; no deployed runtime is known.

**Current automated evidence:** `npm test`: 2 passed. `npm run assess:identity`: 8 failed as expected, reproducing the unresolved security gaps; these failures are evidence of problems, not successful security acceptance. All 108 repository JavaScript files passed syntax checks on Node v24.19.0; `git diff --check` passed. See `test/README.md` for commands and interpretation.

**Setup and limits:** `npm ci --ignore-scripts --no-audit --no-fund` installed 209 locked packages. No dependency or lockfile changes. Install scripts intentionally disabled; Prisma generation, native module setup, real database access, full application startup, actual email delivery, Stripe integration, deployment behavior/proxy configuration, advisory review, and media access remain unverified. The HTTP fixture mounts selected routers, not the complete app. The original source findings below remain applicable. The ranked priorities are unchanged; none is closed by this branch.

## Architecture and setup at original source review

- `index.js`: CommonJS Node/Express HTTP server, default port 8080, open CORS, cookie parser, global JSON/form parsing, static `public/` mount (directory absent), `/api/v1` routers, JSON error handler. No audio streaming/proxy or signed playback URL generation found.
- Lockfile versions: Express 4.21.2, Prisma/client 4.12.0, Stripe 17.5.0, nodemon 3.0.1. No Node `engines` or version file; local Node v26.3.0/npm 11.16.0 are inspection tools, not verified deployment requirements. Controllers each instantiate Prisma clients; connection usage needs measurement against the actual database plan.
- Active data access is Prisma/PostgreSQL: `prisma/schema.prisma:8–12`, PostgreSQL migration lock, and 24 SQL migrations. `DATABASE_URL` is the application connection. The Heroku-named shadow URL is migration scratch space, not evidence of current hosting. Migration history includes a required timestamp change that could fail on existing null values; deployed migration state is unknown.
- `README.md` describes MySQL/Cloudinary; `config/config.js` and top-level `migrations/*.js` are legacy Sequelize/MySQL code, not imported by the current server. Sequelize CLI is not declared. A credential-like literal exists in legacy config; do not copy it, and establish whether it was ever reused before deciding rotation scope.
- npm lockfile exists. `start` runs nodemon; no test/lint/build scripts or tracked CI/deployment configuration found. `seed` targets a missing file. Prisma seed entry is a stub; individual seed scripts use ESM imports in an otherwise CommonJS project and have not been execution-verified. Do not assume a usable fresh-database seed workflow.
- Needed config: `DATABASE_URL`, `API_KEY`, `JWT_SECRET`, `STRIPE_SECRET_KEY`, `CLIENT_URL`; optional `PORT`. Dotenv is loaded in payment/user controllers, after `PORT` is read. No env template or startup validation. Use separate local/test credentials. Checkout has no installed dependencies or local env file.
- Intended workflow from `migrations/migration.md`: development `npx prisma migrate dev --name <NAME>`, release `prisma migrate deploy`. No release automation is recorded. Never point development or shadow URLs at a real environment. Fresh migration replay, schema consistency, Prisma generation, and startup remain unverified.

## Request and identity flow

1. Most endpoints require a shared API key in the URL. A shared key identifies a caller/application, not an individual user or permission. Frontend source confirms browser requests use `VITE_API_KEY`; the shared key must therefore be treated as public to visitors. Deployed build values were not inspected. CORS does not authenticate requests.
2. `POST /api/v1/user/:key` creates a Stripe Customer and returns its ID; `customer.created` is expected to create the local User. The returned placeholder token is not authentication. Identity is linked through unique email and Stripe customer ID; no password login is implemented.
3. API-key callers can request an email JWT for a known email and receive it directly (`controllers/auth/controller.get.js:28–76`); no backend email delivery/ownership proof occurs. The session endpoint verifies that JWT's email then returns another JWT. Email tokens last 1000 hours; session tokens last 100 hours and contain the user record. Tokens are replayable; persisted Token handling is commented out. Account-update uses a hardcoded shared bypass; admin-token grants an admin JWT for the shared API key.
4. Checkout accepts a caller-supplied customer ID and hardcodes a Stripe price. Success redirect is not authoritative payment proof. Webhooks create/update local subscription state. Both `User.subscriptionActive` and `Subscription.status` store status; only User status changes on updates. JWTs also contain a snapshot of user state.
5. `/track/public/:key` filters `public: true`. `/track/:key` returns all tracks including URL fields, with JWT middleware commented out and no subscription lookup. No server-side entitlement decision exists here. A frontend paywall cannot protect this endpoint. Seed URLs use Cloudinary; deployed media privacy and whether copied URLs remain playable are unknown.
6. Account/customer IDs supplied to portal, Checkout, session retrieval, and payment update are not bound to verified account identity. The sole active JWT middleware use is payment update; it verifies a signature but discards decoded identity and does not enforce role, account ownership, or current subscription.

## Owner clarification and frontend reference check

Owner confirms backend/database on Heroku, audio on Cloudinary, one monthly paid tier with automatic card renewal, magic-email login, and in-app account management linking to Stripe UI. Intended persistent login was described tentatively as a refresh token. Relevant source was inspected read-only in `/Users/tomekregulski/Desktop/rvdl/roop-verma-archive-client` (HEAD `baefaf4`); backend baseline HEAD is `3d91b1b`. Neither commit is confirmed deployed.

- **Magic email:** `src/views/Login.tsx` requests the email token, receives it in the browser, then sends it through EmailJS. `CompleteRegistration.tsx` does the same after retrieving Checkout session details. This confirms the mailbox-proof bypass in priority #1; sending email after disclosing the credential does not prove that the requester owns that mailbox. Move issuance/delivery behind the server boundary while preserving the intended email-link experience; this will require a narrowly scoped client integration change in a future authorized session.
- **Session persistence:** `LoginGate.tsx:37` writes the JWT with `document.cookie`, without explicit expiry, HttpOnly or Secure attributes. `util/isValidJwt.ts` only finds the cookie; `AuthContext.tsx` decodes it and looks up the customer through an API-key-only endpoint. No refresh-token endpoint, token rotation, or JWT `exp` check was found in either repository's reviewed auth flow. The implementation is a session JWT in a browser cookie, not the intended refresh-token mechanism; UI login may outlast JWT expiry because current checks never verify it. Choose a simple explicit session duration/re-login policy before adding refresh-token complexity.
- **Entitlements:** `AuthContext.tsx` permits `trialing`, `active`, and `incomplete`. Confirm the intended treatment of incomplete payment before using that policy on the server. The mount-time customer lookup refreshes the UI's allowed flag, but it is not server-side audio authorization. `AudioContext.tsx` chooses private/public endpoints based on UI flags; a separate `queries/audioQueries.ts` helper used by `AudioView.tsx` requests all tracks even for anonymous users. Backend enforcement is essential regardless of client path.
- **Stripe UI:** `Signup.tsx` and `util/handleCheckout.tsx` create a customer then redirect to Stripe Checkout; `ManageAccount.tsx` opens Billing Portal with a caller-supplied customer ID and uses Checkout again for resubscription. Checkout and Billing Portal are separate Stripe-hosted flows; exact portal capabilities/configuration remain unverified. Preserve hosted payment UI and derive the customer from authenticated identity on the server. A source comment reports resubscription causing a database problem; this is an unverified report consistent with the one-subscription uniqueness/retry risks, not a reproduced crash.
- **Admin boundary:** `context/AdminContext.tsx` compares a browser-provided password against `VITE_ADMIN_PASSWORD`. That UI gate cannot replace backend admin authorization. No environment values or deployed assets were read.

Priority order remains unchanged. No frontend fixes, new refresh-token design, or expanded implementation scope are authorized by this reference check.

## Five immediate priorities, in order

| Rank | Confirmed evidence | Impact | Suggested verification / acceptance test |
| --- | --- | --- | --- |
| 1 — Critical: establish identity and admin/account authorization | Auth token issuance above; `routes/v1/user/index.js:8–19` exposes user enumeration, deletion and delete-all behind only the shared key. Catalog CRUD uses the same key. `controllers/user/controller.post.js:52–63` accepts a portal customer ID; payment update accepts arbitrary customer IDs. | API-key holders can impersonate known accounts, mutate/delete archive/account data, and request another customer's portal session. A browser-delivered key cannot be the admin boundary. | Synthetic users A/B: knowing A's email must not produce a usable login token without mailbox proof; reject replay/expiry and account-update bypass. Ordinary A cannot mint admin tokens, list/delete users, edit catalog, or manage B's Stripe customer. Remove/disable testing-only delete-all. |
| 2 — Critical: authenticate Stripe webhooks | `routes/v1/payments/index.js:19–21`; `controller.post.js:39–43` trusts `req.body`; no signature/constructEvent/signing-secret use. Global JSON parser runs first (`index.js:15–19`). | Unauthenticated forged events can create/delete users and change subscription state. | Missing/invalid/tampered signatures return 400 with zero writes; valid signed fixture succeeds. Preserve raw request bytes before JSON parsing and verify with endpoint signing secret. Test in isolation first. |
| 3 — High: enforce audio entitlement on the server and media delivery | `routes/v1/track/index.js:8–22`; `controllers/track/controller.get.js:6–27` returns all records/URLs without identity or status checks. | Unsubscribed callers with the shared key can obtain private URLs; media may remain accessible after logout/cancellation. | No JWT, expired JWT, inactive user and deleted user cannot obtain private audio. An active user can; public tracks remain available. Confirm copied media URL behavior anonymously and expiry after revocation using designated test assets. Decide whether time-limited signed delivery is required on the current provider. |
| 4 — High: make subscription synchronization retryable and consistent | `controller.post.js:64–74,137–175,223–235,264–284,298`: caught failures still get 200; create path has uncaught async errors; creation and User update are separate writes; no event-ID dedupe/transaction/order recovery. Subscription status becomes stale. `cancelAt` expects String but payload passes Stripe timestamp/null; price/product fields are placeholders. | Legitimate subscribers may be locked out or stale access may persist. Duplicate creation can hit uniqueness constraints; partial failure can prevent repair on retry. Delayed events may overwrite newer state. | Repeat/concurrently deliver the same event; update-before-create; customer missing; DB outage; failure between writes; cancellation/resubscribe and paid/failed renewal. Require consistent state, retryable failure, no stale overwrite, and a documented replay/reconciliation procedure. Verify non-null cancel timestamp against Prisma and actual test-mode payload/API version. |
| 5 — High: establish reproducible local checks and safe operations | No test script/CI/version pin; broken seed target; deployment migration history unknown. API-key middleware calls `next(error)` then `next()` (`middleware/isValidateApiKey.js:4–10`); missing JWT also continues into verification. Controllers log tokens, account records and webhook payloads. Unauthenticated `/payment/webhookLogs` reads logs, though no writer was found. | Regressions and deployment failures are hard to catch; logs/URLs expose sensitive values. Double continuation is a confirmed defect, but an HTTP authorization bypass was not established. | Disposable PostgreSQL: lockfile install, client generation, migration replay, schema validation, startup and route smoke checks on a supported/pinned runtime. Test middleware calls next once and denies bad credentials over HTTP; verify redacted logs/errors and restrict log access. Review lockfile advisories before targeted upgrades. |

Stripe requires raw-body signature verification, can deliver duplicates and out of order, and retries failed live deliveries for up to three days. A successful response to a swallowed failure forfeits automatic retry for that delivery. Idempotency means repeating delivery has the same effect as processing it once. No working event ledger exists here: WebhookLog has neither unique Stripe event ID nor processing state and is not written by the handler. A small database-backed approach is preferable to introducing queue infrastructure at this scale. [Stripe webhook documentation](https://docs.stripe.com/webhooks).

## Original baseline checks and limits (before this branch)

- `npm run`: confirmed only start/seed scripts. `git status --short`: initially clean.
- `node --check` on all 105 JS files: passed. Syntax checks do not execute imports, validate Prisma queries, or prove Node/Prisma compatibility.
- Six offline probes loaded source with VM-isolated fake Prisma/Stripe/JWT modules; no network or real credentials: bad API key calls both error/success continuations; unsigned customer event writes/returns 200; subscription-update DB failure returns 200; subscription-before-customer rejects without response/error forwarding; all-tracks exposes a synthetic private URL without JWT; email-token returns a synthetic token for supplied email. These are handler/middleware observations, not full HTTP/integration tests. Probe script was temporary, outside the repository.
- No dependency advisory scan, install, Prisma execution, HTTP startup, Stripe API call, or live-media check performed. Relevant frontend source was subsequently inspected read-only; no frontend code was changed. Express 4 does not itself provide Express 5's automatic rejected-promise forwarding; uncaught async paths need explicit handling. This runtime behavior needs an HTTP regression test in the installed stack. [Express migration reference](https://expressjs.com/en/guide/migrating-5/#rejected-promises-handled-from-middleware-and-handlers).
- Other observed follow-ups within the baseline: customer.updated is a no-op; pause/resume cases are commented out; invoice events are not handled; null customer names can throw before error handling; track-play creation lacks Prisma's `data` wrapper; network-error creation uses `emailAddress` while schema has `userEmailAddress`. These are not additional immediate priorities; fold payment cases into #4 and defer telemetry fixes unless needed for beta monitoring.

## Beta checklist and deployment questions

All unchecked; source inspection cannot establish deployed configuration. Owner confirmed Heroku for backend/PostgreSQL and Cloudinary for audio. Exact plans, deployed versions and media configuration remain unknown.

- [ ] Record current backend/DB/media/frontend providers and plans, deployed commit, Node/npm versions, start/build/release commands, environment separation and rollback procedure. Provider names are owner-confirmed; plan and deployed-version checks remain open. Frontend source at `../roop-verma-archive-client` was inspected only for backend-relevant flows; API-key browser exposure is confirmed in source.
- [ ] Obtain configuration names/presence only: HTTPS/domain, secrets management, key rotation history, DB TLS/connection limits, migration version and backup retention. Confirm shadow DB is disposable and independent. Owner can supply sanitized metadata; production access is outside this session.
- [ ] Close #1–3 before inviting beta users: mailbox proof, identity/role/ownership checks, private audio entitlement and designated media access tests. Remove auth/token/customer logging; avoid keys/tokens in request URLs. Add modest rate limits to login/registration/write endpoints and verify proxy configuration.
- [ ] Decide entitlement policy explicitly: active/trialing, past_due grace period, incomplete/unpaid/canceled/paused, cancel-at-period-end versus immediate cancel, and pause collection versus paused subscription. Verify server reads current authoritative state rather than trusting old JWT status.
- [ ] Close #4 in Stripe test mode: endpoint URL `/api/v1/payment/webhooks`, signing secret, subscribed event types, snapshot/API version compatibility, hardcoded price validity, portal configuration, retry/duplicate/order cases, failed renewal, cancellation and resubscription. Verify test/live separation; no live billing tests needed.
- [ ] Close #5: install/generate/start on one supported runtime; replay all migrations on disposable local PostgreSQL; create minimal synthetic fixture workflow and focused automated checks. Confirm no production URLs are loaded. Review advisory output and fix relevant dependencies selectively.
- [ ] Establish a small operational routine: uptime/failure alert, actionable webhook error/event-ID logs without payloads, manual replay/reconciliation instructions, database restore rehearsal into a disposable database, and recovery contact/procedure. Check memory/connections with a handful of concurrent test users; 100 registered users is not 100 simultaneous streams.
- [ ] Record beta archive size, delivered audio bitrate, listening hours, media quota/overage behavior, and billing alerts before committing to the launch budget.

## Hosting budget: planning examples, not a migration proposal

Keep Heroku and Cloudinary while measuring their current plans and usage. Compute is unlikely to be the dominant cost for this scale; audio storage and delivery can be. Published prices checked 2026-10-17, before tax, domain, payment fees, email, and optional monitoring/backups:

| Scenario | Illustrative monthly cost | Conditions |
| --- | --- | --- |
| Development on Heroku-sized services | $10: Eco $5 + Essential-0 PostgreSQL $5 | Sleeping server acceptable; media stays within free allowance. |
| Small always-on beta | $12 base: Basic $7 + Essential-0 $5; reserve $5–15 for other needs | $17–27 planning envelope, conditional on media fitting included/free quotas and backup/email needs. Not a capacity guarantee. |
| Same backend with Cloudinary Plus | About $111 base: $12 + $99 monthly media plan | Exceeds target before extras. Do not upgrade or migrate now; first measure archive and listening usage. |

These are arithmetic examples from [Heroku pricing](https://www.heroku.com/pricing/) and [Cloudinary pricing](https://cloudinary.com/pricing), not verified costs of the current deployment. Essential-0 offers 1 GB and 20 connections; verify connection usage and recovery needs before relying on it. Cloudinary Free supplies 25 credits shared across storage, transformations and delivery; quotas are not 25 GB exclusively for listening. Confirm how this account meters audio. [Cloudinary billing guide](https://cloudinary.com/documentation/billing_and_plans).

At a constant 128 kbps, one listening hour is approximately 57.6 MB; 100 people listening 2 hours/month is about 11.5 GB delivery, and 10 hours/month is about 57.6 GB. At 256 kbps double those figures; downloads/replays add usage. A 100-hour archive at 128 kbps is about 5.8 GB before originals/derivatives. Thus under $30 is plausible, not established; a large archive or Cloudinary paid-plan threshold can break it even with few accounts. A provider change only becomes a scoped decision if measured cost or required access controls cannot meet the budget.

## Next bounded task — secure email login, preparation then implementation

Priority #1 remains first. Aim for one complete functional outcome: a user can obtain a session only by using a short-lived, single-use link delivered to their mailbox by the server. Preserve the intended magic-email experience. Do not roll the whole admin, payment-ownership, audio, or webhook backlog into that task.

1. Confirm the server-controlled mail delivery option, test credentials/configuration names and sender setup with the owner. Use synthetic mail capture locally; a successful mocked send is not evidence of actual delivery. Confirm sanitized development exposure/access-control metadata, without inspecting production data. The client needs narrow integration changes in Login, CompleteRegistration and LoginGate; frontend implementation needs explicit authorization because current constraints are read-only.
2. Define the request/exchange contract: a generic login-request response containing no credential or account data; cryptographically random, short-lived proof stored as a hash; atomic single-use consumption tied to a local user ID; and an explicit session lifetime. Deny replay, expired/invalid proof, and failures to deliver. Decide a simple session/re-login policy before adding refresh-token complexity. Review any required schema change and test it only on a disposable local database; no remote migration is authorized.
3. Reuse the synthetic HTTP fixture and add failing security tests for known/unknown email responses, send failure, successful mailbox proof, expiry, replay/concurrent exchange, and user-ID binding. Verify no alternate path (legacy session exchange or hardcoded account-update bypass) can obtain an ordinary user session without proof. Implement backend and authorized client changes together, replacing old login flows with working secure ones; promote the relevant assessment assertions into passing regression checks.
4. If delivery setup or client authorization is unavailable, stop at a documented contract, reproduction tests and concrete remaining requirements. Do not substitute temporary route closures for a completed login fix. Record admin issuance/user authorization as still unresolved; this bounded login outcome will not close all of priority #1.

Subsequent bounded tasks: trusted admin/user authorization (including explicit removal of testing-only delete-all), then webhook signature verification with signed/missing/invalid/tampered fixtures through the actual Express middleware stack, then remaining account ownership/entitlement and subscription consistency work. Keep the ranked blocker list separate from what can fit in one session. No beta invitation until priorities #1–3 are satisfied. At 2–4 hours/week over 12–16 weeks, total capacity is roughly 24–64 hours: use it for functional blocker fixes rather than stack modernization.
