# Current verification — isolated D9 deletion, 2026-11-02

Current evidence/limits: [purchase and D9 handoff](../STRIPE_LED_PURCHASE_IMPLEMENTATION.md).
D9 extends the existing candidate fixtures, with no normal-runtime cutover:

- Node 24.19.0 full synthetic suite: **350 pass** (27 shared D9 cases added).
- Full fresh disposable PostgreSQL billing suite: **214 pass** (same 27 D9 cases
  plus four SQL/independent-client checks). `test:billing:local` and
  `test:purchase:local` include D9. No existing or remote database was used.
- SQL checks cover final-delete rollback of earlier scrubbing/tombstones, stale
  local facts across provider reads, concurrent proof exchange/session cascades
  and ambiguous concurrent completion. Prior migration-upgrade/mismatch assertions
  remain; only historical fixture migration/insert boundaries were adjusted.
- React purchase/deletion page: **29 assertions pass**; player page: **23 pass**.
  Real browser request/review/withdraw/re-request/complete journey uses the existing
  `node test/browser-harness.mjs --purchase`, HTTP/cookies/disposable PG and fake
  providers. Focused React errors/session/unmount tests use an Axios double.
- Frontend unit suite: **14 pass**; TypeScript, changed-source ESLint, normal Vite
  build pass. Existing large-bundle/browser-data warnings remain.
- Separate strict schema diagnostic: **6 pass / 1 fail**, only the pre-existing
  NetworkError.errorCode Required→Nullable mismatch, visible and unsuppressed.

No real Stripe/email/media, runtime activation, provider setup, deployment or
existing-data retention preflight is established by these results.

---

# Current verification — isolated D1/D8 purchase, 2026-11-01

Read [STRIPE_LED_PURCHASE_IMPLEMENTATION.md](../STRIPE_LED_PURCHASE_IMPLEMENTATION.md)
for reproduction, GET/POST counts, schema/fixture limits and remaining gates.
Normal runtime/routes remain on the old composition; no real provider action.

- Backend `node --test test/*.test.js`: **323 pass**.
- `npm run test:billing:local`: **183 pass** in a new disposable PostgreSQL cluster,
  including identity, legacy billing, paid access and purchase. Set the optional
  `EMBEDDED_POSTGRES_MODULE` as described below; use Node 24.19.0.
- `npm run test:purchase:local`: smaller identity + purchase subset; guarded
  `test:purchase:db` accepts only the explicit disposable loopback test database.
- Frontend `node --test test/*.test.cjs`: **14 pass**; TypeScript, changed-source
  ESLint and Vite build pass. Existing build size/browser-data-age warnings remain.
- Frontend `node test/browser-harness.mjs --purchase`: explicit test-only candidate,
  real HTTP/cookies/Prisma/disposable PostgreSQL, fake mail/Stripe/media. Signup,
  abandon/reload/resume, pending return, confirmation, playback eligibility,
  Portal, expired retry and unresolved/help were driven through the browser.
- `/test/purchase-ui-browser.html`: **15 focused React assertions pass** with an
  Axios double. `/test/playback-browser.html`: **23 existing assertions pass**.
  These pages complement the real HTTP journey; no headless E2E runner was added.
- Prisma validate, **162** backend JS syntax checks, new/refactored module formatting
  and diff whitespace pass. Separate strict schema assessment: **6 pass / 1 fail**,
  only the retained pre-existing telemetry nullability mismatch.

The owned-attempt concurrency regression is deterministic across two Prisma clients:
a delayed unknown-outcome read cannot replace an attempt whose Session ID was just
persisted. Provider success/write failure, association rollback, pending deletion,
stale completion, uniqueness and old-cache replacement races also use PostgreSQL.
No purchase business journey seeds the selected binding. SQL/fixture upgrade tests
preserve earlier data/security assertions and applied migration history.

---

# Previous verification — isolated Stripe-led access, 2026-11-01

Owner-authorized first slice only; no normal-runtime cutover. See
[PAID_ACCESS_IMPLEMENTATION.md](../PAID_ACCESS_IMPLEMENTATION.md) for code/contract,
observed GET counts and remaining dependencies. D1–D10 policy approval is recorded
in `STRIPE_LED_DECISIONS.md`; broader implementation is not authorized.

- Full synthetic suite: **290 pass**, retaining earlier 246 plus 44 new access cases.
- `npm run test:billing:local`: **144 pass** with real disposable PostgreSQL: earlier
  91 plus the same 44 cases and nine new SQL/independent-client checks.
- `npm run test:paid-access:local`: runs identity plus the isolated access DB suite
  in a new cluster; `test:paid-access:db` runs only that suite on an explicitly
  guarded disposable local DB. Set `EMBEDDED_POSTGRES_MODULE` as described below.
- Separate `assess:schema:local`: **6 pass, 1 fail**, solely existing telemetry
  nullability drift, unchanged/unsuppressed. Prisma validate, 155 JS syntax checks,
  changed-file formatting and diff whitespace pass.

The new adapter runs through actual HTTP playback and raw-body signature verification,
using fake Stripe resources and media. Independent DB clients prove veto/selection/
deletion races and stale-fill safety. It writes no financial grants or event ledger.
Existing legacy-policy tests remain scoped to the retained old engine. None of
these local results establish real Stripe behavior, private delivery or launch readiness.

---

# Previous backend verification — 2026-11-01

Use Node **24.19.0**, locked Stripe **17.5.0** / request API
**2024-12-18.acacia**, Prisma **4.12.0**, and generated Prisma client.
The billing readability pass keeps every earlier lifecycle/security assertion.
Current results supersede the dated counts below:

| Command/check | Result | What it establishes |
| --- | --- | --- |
| `npm test` | **246 pass** | Full synthetic regression: the 166 earlier checks, 78 billing lifecycle cases, and two explicit request-budget checks |
| `npm run test:billing:local` | **91 pass** | Real disposable PostgreSQL 18.4: the same 78 billing cases, seven SQL/CLI/migration checks, six identity checks |
| `npm run assess:schema:local` | **6 pass, 1 fail** | Separate strict diagnostic retains only existing NetworkError.errorCode nullability drift |
| Prisma validate, JavaScript syntax, diff check | Pass | Local validation; no service startup or real provider calls |

`test/support/billing-cases.js` is shared by the memory and PostgreSQL suites.
It exercises signed events through the actual Express verifier/controller,
current-resource qualifier, transaction path and persisted entitlement reader,
then playback with a verified session and recording fake delivery. Fixtures supply
Stripe resources, never an entitlement result. PostgreSQL uses real catalog,
identity, billing and ownership rows. Memory serialization is not database evidence;
fake financial resources do not establish actual Stripe semantics.

Read the case names for payment rejection, duplicate/concurrent delivery, stale
fetch/refund and deletion races, rollback/retry, resumable repair, original-period
boundaries, cancellation, refund/dispute restoration, duplicate subscriptions,
registration/Checkout operation recovery, tombstones, mode/ownership corruption,
public playback, no signer on denial, and version/body/signature rejection.
PostgreSQL-only cases add competing clients, real SQL write failures, constraints,
offline CLI inspect/apply, full migration replay, prior-schema upgrade/redeploy
and legacy association refusal. The replacement request limiter has explicit
call-count/failure and elapsed-time tests in `billing-budget.test.js`.

The optional tool setup below still applies: set `EMBEDDED_POSTGRES_MODULE` to its
absolute `dist/index.js`, then run `npm run test:billing:local`. The runner starts,
stops and removes a fresh loopback cluster. Alternatively, `test:billing:db` accepts
only the explicitly guarded disposable local `rvdl_identity_test` database via
`TEST_DATABASE_URL`. No suite loads `.env` or real provider credentials. Existing
CI retains its identity DB command; run the expanded billing DB command explicitly.

The separate strict schema assertion is unchanged and failing. A passing billing
schema-diff boundary check does not replace or mute it. Real provider/financial
behavior, hosted CI execution, private media, public-URL retirement and deployed
behavior remain unverified. See [BILLING_API.md](../BILLING_API.md) for the reader's
guide and [Operations.md](../Operations.md) for repair. No restoration or readiness
claim follows from these local results.

---

# Playback regression update — 2026-10-28

Pinned Node 24.19.0: `node --test test/*.test.js` (same command as `npm test`):
**166 passed**. The 140 existing checks remain, with 25 new HTTP playback/catalog
checks in `playback-access.test.js` and one normal-runtime fail-closed check in
`playback-runtime.test.js`. The route inventory includes issuance. All identity,
admin, ownership and signed-webhook assertions remain enabled.

Playback tests inject normalized paid periods, an explicit playback asset mapping
and a recording fake signer only through the module-loader fixture. No deployed
application/configuration can enable them. Tests cover exact paid expiry,
cancellation, unavailable/ambiguous/revoked/unapproved grants, invalid sessions,
spoofed authority, mapping scope, signed expiry and catalog projection including
nested/mutation/case variants. Normal composition cannot return fake/legacy URLs.
See [PLAYBACK_API.md](../PLAYBACK_API.md) for precise contracts and limits.

The sibling client's `test/playback-browser.html` runs 23 actual React browser
assertions with isolated Axios/Audio doubles. This is separate from HTTP tests;
it does not verify real delivery, media bytes, Range/seek or storage expiration.
No PostgreSQL or provider tests were added or rerun. Earlier evidence follows.

# Local backend identity checks

Latest local catalog/admin run (2026-10-25), Node **24.19.0**:
`node --test test/catalog-authorization.test.js`: **70 passed**;
`npm test`: **140 passed**, including all 70 previous synthetic checks.
No failures, skips or TODOs. Use the pinned runtime for both commands.

Catalog tests mount the actual full app with the existing identity fixture and
stateful catalog doubles from `support/catalog-db.js`. All 24 catalog mutations
plus three owner-approved tribute management routes are checked for anonymous,
invalid/expired/revoked identity, non-admin/spoofed roles, current-role demotion,
CSRF/origin/key rejection, deleted/changed-email users and storage failure.
Denied requests assert unchanged full storage and no calls beyond identity
reads. Mounted routes/methods are compared with the reviewed inventory, including
alternate public-track/playback paths; new routes/aliases require review. Nested/
bulk input denials and successful admin CRUD/moderation are exercised. Existing
public reads and playback access are retained. Tribute POST has no frontend
form/caller and now has the full admin denial matrix and an admin creation check.

The media-type PUT guard is tested, but its pre-existing Location update bug is
recorded separately, not certified as correct. Fake storage does not prove
Prisma constraints or nested-write validity. No database checks were needed for
this route-only change using unchanged session/role mechanisms; PostgreSQL and
strict-schema results below remain historical. No real external services,
production records, remote SQL or deployment were used. Full route inventory
and remaining blockers: [current handoff](../BACKEND_BASELINE.md).

Current CI setup and the 2026-10-24 pinned-runtime rerun are recorded in
[CI.md](../CI.md): 70 synthetic and six PostgreSQL identity checks pass; the
separate strict schema diagnostic still fails on NetworkError.errorCode.
Hosted runs remain pending. Earlier dated results below are historical.

Use Node 24.19.0 (`.nvmrc`) and npm. Install locked dependencies with
`npm ci --ignore-scripts --no-audit --no-fund`. Prisma client generation is a
separate step for database/application use; synthetic tests need no .env or
service credentials. These commands need loopback binding permission.

## Synthetic HTTP regression and retained acceptance targets

- `npm test`: **70 passed** (2026-10-22), including the 51 existing checks and 19
  webhook authenticity/middleware checks. Includes the two updated smoke checks,
  all eight original vulnerability assertions, and the automated curl walkthrough.
- `npm run assess:identity`: **8 passed** independently. The original assertions
  remain in test/assessment/identity.assessment.js and are also loaded by normal
  regression tests. None is skipped, inverted, weakened or declared out of scope.

Before implementation, on this same Node runtime: the original two smoke checks
passed and all eight assessment checks failed on their desired-security
assertions. The sandbox initially denied loopback; the permitted baseline rerun
reached those assertions.

The fixture mounts the **full actual Express app**, including parsers, CORS,
cookies, routers and error handling. It injects a stateful in-memory Prisma
double, a fake HTTP transport beneath the actual Resend adapter, and synthetic
Stripe API clients. Webhook signing and verification use the real locked Stripe
SDK offline. It prevents dotenv and actual service-client construction.
The application identity service and HTTP middleware are real. Tests isolate
module injection by creating one fixture per Node test process.

`node --test test/stripe-webhook.test.js`: **19 passed**. Exercises the actual
app/parser/router/controller composition with a test-only signing secret,
synthetic payloads and fake services. Checks persisted customer fields and actual
deletion for valid signed events, unhandled-event acknowledgement, missing and
invalid signatures, payload/whitespace tampering, stale timestamps, absent/empty/
blank configuration, non-JSON content and signed malformed JSON. Each rejected
request asserts zero service calls (including database reads), unchanged tables,
generic errors and no logs. Ordinary registration JSON is checked by asserting the
exact parsed parameters received by fake Stripe. No production credentials,
network Stripe calls, real events or hosted webhook settings are used.

These two commands passed on available Node v26.3.0/npm 11.16.0; this is evidence
for the synthetic paths only. Node 24.19.0 remains the pinned runtime; it was not
available for this session's rerun. Prior PostgreSQL/schema evidence below was
not rerun. Real startup/provider/deployment compatibility remains unverified.
Signing-secret setup and deployment checks are in [Operations.md](../Operations.md).

Coverage: server-controlled initiation and generic known/unknown responses;
successful verification; stored hashes and cookie attributes; invalid/expired/
pending/replayed/concurrently reused proofs; transactional rollback; changed or
deleted user; absolute session expiry; logout and rotation; CSRF/CORS; validation,
body limits, rate limits and spoofed forwarding headers; retained legacy bypass
denials; user/admin boundaries; unauthenticated/cross-account denial before
Stripe; authorized portal/Checkout/lookup/payment operations.

Synthetic transactions serialize in memory: they do **not** prove PostgreSQL
atomicity. The injected clock and zero response-floor delay keep tests fast;
production keeps its documented lifetimes and response floor. Fake transport
acceptance does **not** prove inbox delivery, provider authentication or actual
network timeout behavior.

The original smoke assertion expecting an insecure legacy exchange to return
500 was replaced with a session endpoint 401/no-service-call assertion. The
registration smoke now supplies the CSRF header, checks validation/limiting and
confirms no placeholder credential is returned. Security assertions were not
relaxed to preserve old behavior.

## Real PostgreSQL + real Prisma, fake mail/Stripe

`npm run test:identity:db` explicitly requires TEST_DATABASE_URL to reference
the dedicated **loopback rvdl_identity_test database**. Unexpected URL options,
other names and non-loopback hosts are refused. Tests create a random schema,
replay all 25 migrations there, seed only synthetic records, and drop only that
schema in teardown. Never supply an existing application's or remote URL.

First generate the locked Prisma client with the CLI against synthetic local
configuration (generation does not migrate a database):

```sh
DATABASE_URL=postgresql://rvdl_test@127.0.0.1:5432/rvdl_identity_test \
HEROKU_POSTGRESQL_BROWN_URL=postgresql://rvdl_test@127.0.0.1:5432/rvdl_identity_shadow \
node node_modules/prisma/build/index.js generate
```

For a fully disposable cluster, `npm run test:identity:local` uses an optional
external `embedded-postgres` test tool via EMBEDDED_POSTGRES_MODULE. No project
dependencies/lockfile were changed to obtain it. The verified macOS arm64 setup:

```sh
RVDL_TEST_TOOLS=$(mktemp -d)
npm install --prefix "$RVDL_TEST_TOOLS" --ignore-scripts --no-audit --no-fund \
  embedded-postgres@18.4.0-beta.17
# Inspect this platform package's symlink hydration script before executing it.
(cd "$RVDL_TEST_TOOLS/node_modules/@embedded-postgres/darwin-arm64" && \
  node scripts/hydrate-symlinks.js)
export EMBEDDED_POSTGRES_MODULE="$RVDL_TEST_TOOLS/node_modules/embedded-postgres/dist/index.js"
npm run test:identity:local
```

Other platforms need their matching platform package or an independently
provisioned disposable local PostgreSQL. These instructions install no system
service. The runner chooses a loopback port, initializes a fresh cluster under
the OS temporary directory, creates a dedicated database, runs the tests, stops
the cluster and removes its generated data. Provider clients remain synthetic.
It explicitly preserves a failing child exit code despite the optional tool's
exit hook.

**Verified result: 6 passed**, using PostgreSQL 18.4 and Prisma 4.12.0 on Node
24.19.0. Includes 24 concurrent HTTP exchanges with one winner; failed session
insertion rollback; expiry/logout/FK cascade; concurrent rate limits; persisted
Checkout ownership and cross-account denial before Stripe; idempotent complete
migration replay. Independent Prisma clients confirm session persistence.
No existing databases or remote migration/shadow database were used.

## Separate strict full-schema assessment — still failing

`npm run assess:schema:local` adds the strict whole-schema no-drift assertion
to the disposable runner. **6 passed, 1 failed**: legacy NetworkError.errorCode
is required in migration history but nullable in the pre-existing Prisma model.
The assessment exits nonzero; its assertion is retained. No identity-table drift
was reported. Fixing telemetry nullability/history is outside the agreed task.
This result must accompany the passing identity checks.

Prisma schema validation/client generation passed. Syntax and whitespace checks
are recorded in IDENTITY_API.md/BACKEND_BASELINE.md. Full app startup with real
provider configuration, actual email delivery, Stripe integration, browser
cookies and deployed behavior remain unverified.

For a manual Postman/curl flow using no real services, see
[IDENTITY_API.md](../IDENTITY_API.md).
