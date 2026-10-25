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
