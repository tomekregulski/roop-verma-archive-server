# Backend email login and account identity — 2026-10-17

Status: implemented locally after the owner's design agreement. Local React/browser integration verified 2026-10-22 with synthetic mail, Stripe and storage; real email and deployed behavior remain unverified. The original baseline was reproduced: 2 smoke checks passed; 8 desired-security assertions failed. Those eight assertions now pass, unchanged in substance, and are included in normal regression tests. This does **not** close the whole security assessment.

## Identity and credential lifecycle

Only a random proof delivered by the server to the existing account's stored mailbox can establish a session. Knowing an email, customer ID, shared API key, or former JWT is insufficient. Login applies to existing local User records; it does not create accounts, subscriptions, or Stripe customers.

Each proof and session uses 32 cryptographically random bytes (256 bits), encoded as 43 base64url characters. PostgreSQL stores SHA-256 hashes, never the raw credentials. A proof records its local user ID, email snapshot, 15-minute expiry, delivery acceptance, and consumption time. It is unusable until the mail provider accepts the send. A conditional update consumes it once; consumption, session creation and previous-browser-session revocation share one transaction. PostgreSQL concurrency tests verify one winner and rollback on insert failure.

Sessions have a seven-day absolute lifetime, without refresh tokens or sliding renewal. Every protected request reads the persisted session and current user; expiration, revocation, account deletion, or a changed email invalidates it. A new verified login rotates the browser's previous session. Logout revokes the current credential server-side and clears the cookie; deleting a cookie alone is insufficient. Other devices remain logged in until their own logout or expiry.

Cookie: `__Host-rv-session`, HttpOnly, Secure, Path=/, no Domain attribute; SameSite=Lax by default; seven-day Max-Age. A deliberately insecure loopback-only development setting uses a different name, `rv-session-local`. Credentials are never returned in JSON or included in API request paths. Authentication and protected account responses use Cache-Control: no-store.

Email matching is case-insensitive while delivery uses the stored address. If multiple existing accounts differ only by email case, initiation returns the generic response and sends nothing; reconcile those records deliberately. No email-address changes or account merging endpoint is introduced.

## API contract

New auth endpoints do not require the public API key. Use JSON for login/verification. Send `X-RVDL-CSRF: 1` on every auth POST and every protected account mutation, including legacy GETs that create Checkout sessions. This header is not a secret; it prevents simple cross-site forms/navigation from invoking these actions. Requests with an Origin must match CLIENT_URL exactly; native API tools may omit Origin. CORS allows credentialed requests only from that configured origin, with Content-Type and X-RVDL-CSRF.

| Method / path | Input / result |
| --- | --- |
| POST /api/v1/auth/login | Exactly `{email}`; 202 with generic message, no account information, credential or cookie |
| POST /api/v1/auth/verify | Exactly `{token}`; 200, Set-Cookie, `{user, expiresAt}` |
| GET /api/v1/auth/session | Cookie; 200 `{user, expiresAt}`, or 401 |
| POST /api/v1/auth/logout | Cookie if present; 204, revoke and clear; idempotent |

The user projection contains id, email, firstName, lastName, stripeId, subscriptionActive and isAdmin. It is current server data, not a JWT payload. It does not establish media entitlement.

Malformed input: 400; invalid/expired/reused/pending proof: the same 401; missing/expired/revoked session: 401; forbidden origin, ownership, role or API key: 403; oversized body: 413; abuse limit: 429 with Retry-After; unexpected database/service errors: generic 500. Provider rejection, timeout or invalid acceptance returns the same generic login 202 as an unknown address, and leaves no usable proof. The only mail-failure log is `login_delivery_failed`, without recipient, credential or provider body. A provider acceptance is not inbox-delivery evidence.

Bodies are limited to 16 KiB. Email input must be a bounded ASCII address. Login uses shared PostgreSQL counters: 20 requests per IP/15-minute fixed window, 5 per normalized email/15-minute window (including unknown emails), and 120 globally/minute. Verification permits 60 attempts per IP/15-minute window. Registration permits 10/IP/hour, validates names/email, and rejects client-supplied role fields. Fixed-window boundaries can permit bursts; they are not a volumetric denial-of-service defense.

Normal initiation responses have a 5.5-second response floor, covering the provider's five-second timeout and reducing ordinary known/unknown timing differences. Database/network stalls can exceed that floor; this is not a constant-time guarantee. Tests inject a clock and omit waiting, without changing production configuration.

## Existing account/payment routes

The shared :key remains for compatibility on existing routes and is public application configuration, not user authorization. These routes now require the verified session:

| Route | Authorization / behavior |
| --- | --- |
| GET /user/:key | Current database admin role required |
| DELETE /user/:key?id=... | Admin only, validated positive integer; deletes local record, cascades identity data; 204 |
| DELETE /user/all/:key | Permanently removed, 410; no database calls |
| GET /user/find-by-stripe-id/:key?stripeId=... | Self only; optional identifier must match; data comes from acting user's server record |
| POST /user/create-portal-session/:key | Optional customerId must match; actual Stripe customer always comes from acting user |
| GET /payment/checkout-session/:key/:stripeId | Target must match acting user; store Checkout ownership before returning the session |
| GET /payment/checkout-session-resubscribe/:key/:stripeId | Same ownership enforcement and persistence |
| POST /payment/checkout-session-object/:key | `{sessionId}` must have a local ownership record matching user and current customer, before Stripe retrieval |
| PUT /payment/update-payment/:key | Optional stripe_id must match; subscription_id must match the acting user's local subscription and customer; validate payment_method; actual customer comes from acting user |
| GET /payment/webhookLogs | Admin session required |

Paths above are relative to /api/v1. Authentication failures precede any Stripe call. Cross-account targets are denied before Stripe. Synthetic tests also verify authorized requests still execute their original provider operations. Checkout items, prices, mode, redirects and payment update operations remain unchanged. The payment provider remains responsible for rejecting a payment method already attached to another customer; the backend does not possess a local ownership ledger for arbitrary payment-method IDs.

Checkout lookup rejects old/unrecorded IDs. The backend records IDs only when it creates a session for the verified user. If Stripe creation succeeds but the ownership write fails, the response fails closed; an unused external session can remain, and a retry may create another. No distributed transaction or billing reconciliation was added.

Legacy email-token, session-token, admin-token and account-update-token GETs return 410 and perform no credential issuance. Old JWT headers/cookies cannot authenticate. Admins use the same mailbox-proof flow as everyone else; the role must already exist in trusted database state. There is no public admin provisioning API.

## Catalog management and tribute moderation — 2026-10-25

POST/PUT/DELETE on `/artist/:key`, `/category/:key`, `/event/:key`,
`/location/:key`, `/media-type/:key`, `/raga/:key`, `/tape/:key` and `/track/:key`
now require the session cookie, `X-RVDL-CSRF: 1`, the existing public API key and
the current database user's `isAdmin === true`. The owner also selected this
policy for POST/PUT/DELETE `/tribute/:key` after confirming no frontend tribute
submission form or POST caller exists. Paths are relative to `/api/v1`.
Supplied Origin must exactly match CLIENT_URL; native tools may omit Origin.
Responses use no-store. Missing/invalid/expired/revoked identity returns 401;
role, CSRF/origin or key denial returns 403, before the management controller.

The existing `identity.authenticate` loads the persisted session and current
related User on each request. `requireAdmin` checks that current user, so removing
admin privilege invalidates mutation authority on the next request with the same
session. Client roles and legacy JWTs do not participate. No admin provisioning
API was added. Existing controller payload/response contracts are preserved.

GET catalog/tribute routes and track-play telemetry keep their existing access
policy. Tribute creation is admin-only; no public submission workflow is enabled. This change does not enforce private media entitlement.
See [the current handoff](BACKEND_BASELINE.md) for inventory, evidence and the
existing media-type PUT bug (it targets Location), which remains unchanged.

## Required configuration (names only; never commit values)

| Name | Purpose |
| --- | --- |
| DATABASE_URL | Application PostgreSQL connection, explicitly separate local/test/deployed environments |
| API_KEY | Public shared key retained on legacy routes |
| STRIPE_SECRET_KEY | Existing server-only Stripe configuration |
| CLIENT_URL | Exact frontend HTTPS origin; no path/query/credentials; HTTP loopback allowed for development |
| RESEND_API_KEY | Server-only sending credential for the approved provider |
| LOGIN_EMAIL_FROM | Sender configured on the provider's verified domain |
| AUTH_RATE_LIMIT_SECRET | Random secret of at least 32 characters for HMAC rate-counter keys |
| SESSION_COOKIE_SAME_SITE | lax default; strict or none supported; none requires Secure |
| SESSION_COOKIE_SECURE | true default; false allowed only with a loopback client in non-production |
| TRUST_PROXY_HOPS | 0 default; explicitly set only after verifying the deployment's trusted proxy path (integer 0–5) |
| PORT | Optional, defaults to 8080 |
| HEROKU_POSTGRESQL_BROWN_URL | Existing Prisma development shadow URL; must be a separate disposable database; not needed by application queries |
| TEST_DATABASE_URL | Integration-test-only loopback rvdl_identity_test database; never a deployed URL |
| EMBEDDED_POSTGRES_MODULE | Optional local test-tool module path, never deployment configuration |

JWT_SECRET is no longer used by this identity flow; the old library dependency remains locked rather than undergoing unrelated cleanup. Configuration is validated at startup without echoing values. Dotenv loads before PORT and route imports.

Resend account creation, domain verification, sender setup, sending limits, and an explicitly designated test inbox remain pending. Disable provider click tracking for credential links. No real email was sent, and no provider account/settings were changed.

## Shared-domain plan and frontend integration

Intended browser arrangement: HTTPS frontend and API on subdomains of the same registrable domain, for example library.example.org and api.example.org. Cookies remain host-only to the API; sibling origins still need credentialed requests and explicit CORS. Existing Netlify/Heroku sites are cross-site and need SameSite=None; Secure, but browser third-party-cookie policies may still block sessions. No DNS, hosting, certificate or proxy changes were made. Verify the actual domain arrangement and proxy path before deployed use.

The authorized React integration now implements:
- Replace EmailJS issuance/sending in Login and CompleteRegistration with POST /auth/login.
- Read the proof from /login-gate#token=..., remove it immediately from browser history, then POST /auth/verify once. Do not log it or forward it into analytics/error reports. Do not auto-consume proof on a backend GET (mail scanners may follow links).
- Use Axios withCredentials/fetch credentials: include and the CSRF header. Remove JWT decoding and document.cookie login checks; initialize identity with GET /auth/session.
- Call server logout, then clear client state.
- Verify mailbox ownership before requesting Checkout; wait for local account provisioning from the existing customer.created webhook if needed. Registration's returned customer ID is not login.
- Use self identity for account UI; treat 401 as logged out and refresh account state after portal return.
- Test browser cookie acceptance, CORS, CSRF, duplicate React effects, email links, expiry, logout and Checkout/portal return behavior.

These client changes are implemented in the separate frontend checkout. See its `IDENTITY_HANDOFF.md` for tested working-tree hashes, 18 automated in-browser contract checks plus a wrong-origin check, manual-style React browser checks, and local reproduction. Signup requests login at most three times over 40 seconds while waiting for customer.created provisioning, then offers manual retry/help; no account-readiness endpoint or delivery guarantee is introduced. The standalone `test/support/browser-fixture.js` is test-only and exposes synthetic mail controls outside the application. Browser evidence uses HTTP/non-Secure loopback cookies, fake mail/Stripe and memory storage. Production HTTPS cookie/proxy behavior, real delivery and deployed behavior are unverified.

## Manual API walkthrough — no real services

Use Node 24.19.0 (`.nvmrc`), installed locked dependencies, and two terminals. No .env or real credentials are needed. This standalone development process uses the actual full Express app with an in-memory database, fake Resend transport and fake Stripe. It binds only loopback; its mailbox deliberately exposes synthetic proofs for manual testing. It is never mounted by the production entry point.

Terminal 1:

```sh
npm run demo:identity
```

API defaults to http://127.0.0.1:8090 and mailbox to http://127.0.0.1:8091/latest. Accounts: a@example.invalid, b@example.invalid, admin@example.invalid. Stop with Ctrl-C. Data disappears on exit. Real expiry is exercised automatically with injected clocks in the test suite.

Terminal 2 (POSIX shell, curl and Node):

```sh
umask 077
RVDL_DEMO_DIR=$(mktemp -d)
curl -sS -X POST http://127.0.0.1:8090/api/v1/auth/login \
  -H 'Content-Type: application/json' -H 'X-RVDL-CSRF: 1' \
  --data '{"email":"a@example.invalid"}'

# Read the fake email into a request file without printing its credential.
curl -sS http://127.0.0.1:8091/latest | node -e '
let input = "";
process.stdin.on("data", chunk => input += chunk);
process.stdin.on("end", () => {
  const token = new URL(JSON.parse(input).link).hash.slice(7);
  process.stdout.write(JSON.stringify({token}));
});' > "$RVDL_DEMO_DIR/verify.json"

curl -sS http://127.0.0.1:8090/api/v1/auth/verify \
  -H 'Content-Type: application/json' -H 'X-RVDL-CSRF: 1' \
  -c "$RVDL_DEMO_DIR/cookies" --data-binary "@$RVDL_DEMO_DIR/verify.json"
curl -sS -b "$RVDL_DEMO_DIR/cookies" http://127.0.0.1:8090/api/v1/auth/session

# Same proof again: 401. A's request targeting B: 403, without a Stripe call.
curl -sS -o /dev/null -w '%{http_code}\n' http://127.0.0.1:8090/api/v1/auth/verify \
  -H 'Content-Type: application/json' -H 'X-RVDL-CSRF: 1' \
  --data-binary "@$RVDL_DEMO_DIR/verify.json"
curl -sS -o /dev/null -w '%{http_code}\n' -b "$RVDL_DEMO_DIR/cookies" \
  'http://127.0.0.1:8090/api/v1/user/find-by-stripe-id/synthetic-public-key?stripeId=cus_test_b'

# 204, then GET /auth/session returns 401.
curl -sS -o /dev/null -w '%{http_code}\n' -X POST \
  -b "$RVDL_DEMO_DIR/cookies" -c "$RVDL_DEMO_DIR/cookies" \
  -H 'X-RVDL-CSRF: 1' http://127.0.0.1:8090/api/v1/auth/logout
curl -sS -o /dev/null -w '%{http_code}\n' -b "$RVDL_DEMO_DIR/cookies" \
  http://127.0.0.1:8090/api/v1/auth/session
```

Delete only the generated temporary directory afterward. Postman can perform the same calls with its cookie jar: read the synthetic mailbox link, take the fragment token, POST it as JSON, then call session/logout. The demo alone uses a non-Secure local cookie; this does not verify browser handling of the production cookie.

The curl happy path above is also exercised automatically by test/identity-demo.test.js. The surrounding replay/cross-account cases are covered by HTTP regression tests.

## Evidence, schema changes and remaining blockers

Verified: 51 synthetic checks (including all eight original security targets), 8 independent assessment checks, 6 PostgreSQL identity checks, all 123 JavaScript syntax checks and git diff --check passed. Prisma validation/client generation passed. See test/README.md for commands and verification boundaries. New additive migration: 20261017160000_email_identity (LoginProof, IdentitySession, CheckoutOwnership, IdentityRateLimit, indexes and cascading user FKs). Legacy Token records are not accepted. No historical migrations were edited; no deployed credentials or production data were loaded; no remote migrations were run.

Only disposable local schemas/clusters were migrated. Real PostgreSQL tests use real Prisma; email and Stripe remain fake. A strict full-schema assessment still fails: historical migrations make NetworkError.errorCode required while the pre-existing Prisma model declares it nullable. The diff reports no identity-table drift. This telemetry mismatch remains outside identity scope, with its assertion retained and separately runnable; do not mistake the identity suite for a clean full-schema assessment.

Before deploying, review existing migration history/state separately. This branch does not establish remote migration readiness or compatibility with real existing data. Fresh replay has no existing nullable timestamp/duplicate data to expose older migration hazards.

Run `npm run cleanup:identity` only against an explicitly selected database to remove expired proofs, sessions and rate counters. It prints no rows or credentials. No remote cleanup was run and no hosting schedule was installed. Checkout ownership rows remain until account deletion; lifecycle/retention beyond that is future work.

Still unresolved:
- Webhook signatures are enforced and locally tested as of 2026-10-22 (see the current BACKEND_BASELINE.md handoff). Deployed enforcement and synchronization/retry integrity remain unverified; route ownership does not establish lifecycle correctness.
- Private audio entitlement, media URL access and catalog/admin write authorization remain outside this backend identity task. Those endpoints must not be assumed protected by the new session system.
- Stripe provider integration, registration webhook timing, resubscription integrity, admin local deletion versus ongoing Stripe billing, deployment/proxy behavior and production data remain unverified.
- Registration still distinguishes an already registered address with 409. Login initiation itself has the generic response contract; broader signup enumeration policy remains a follow-up.
- Real mail delivery, deployed browser behavior and shared-domain configuration remain pending; local frontend/browser integration is verified as described above.

Sources: [OWASP token guidance](https://cheatsheetseries.owasp.org/cheatsheets/Forgot_Password_Cheat_Sheet.html), [OWASP session management](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html), [MDN cookies](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Set-Cookie), [Resend send API](https://resend.com/docs/api-reference/emails/send-email).
