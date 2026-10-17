# Local HTTP checks

Use a compatible Node runtime: these checks were run on Node v24.19.0. Local
Node v26.3.0 fails while loading the locked JWT dependency; this branch does not
change dependencies or establish a deployment runtime.

Install locked dependencies with `npm ci --ignore-scripts --no-audit --no-fund`.
This deliberately skips install scripts and does not verify Prisma generation or
full application startup. No service credentials or `.env` file are needed.

- `npm test` runs **passing fixture/smoke checks**, not authentication acceptance.
- `npm run assess:identity` runs **desired security assertions**. It currently
  exits nonzero with 8 known failures. That is evidence of unresolved defects,
  not a broken test harness or successful security validation. Run it explicitly
  when assessing identity; it is intentionally excluded from `npm test`.

The shared fixture mounts the actual auth/user routers under Express on an
ephemeral localhost port. It replaces Prisma, Stripe and dotenv during imports,
uses only synthetic records/secrets, and suppresses the legacy controller logs.
No database, mail service, Stripe API, or full application entry point is used.
Tests run in isolated Node test processes; the fixture is intended to be created
once per process because imported controllers retain their dependency doubles.

The assessment covers token disclosure/exchange and the shared-key admin/user
surface. It does not cover future email delivery, proof replay/expiry/concurrency,
all JWT consumers, catalog writes, payment ownership, webhooks or media access.
The app's original behavior is unchanged, including the known vulnerabilities.

When implementing a real fix, extend the relevant acceptance contract and move
its passing security assertions into the regular suite. Do not invert assertions
to treat vulnerable behavior as a successful security test, or hide failures with
skip/TODO. Passing denial checks alone do not establish a working secure login:
include the successful mailbox-proof path. See `BACKEND_BASELINE.md` for the next
bounded task and remaining limits.
