# Working instructions

- One engineer, 2–4 hours/week; beta roughly 3–4 months from the October 2026 baseline. Development hosting budget $10–15/month; launch target under $30/month; 100 registered users would be exceptional success. No real subscribers yet (owner report).
- Establish and improve the backend baseline in small, reviewable changes. Do not broadly refactor or introduce PNPM, TypeScript, a monorepo, or hosting migrations without a concrete need.
- Current outcome: backend email login and account/session ownership guards implemented after the owner approved the design checkpoint. Read `IDENTITY_API.md` and the current handoff at the top of `BACKEND_BASELINE.md`. The eight original identity acceptance targets pass. Webhook signatures are enforced and locally tested (2026-10-22); signing-secret deployment setup/verification, media/catalog authorization and other ranked blockers remain unresolved. Browser integration and deployed verification remain incomplete.
- Owner preference for this unreleased app with no real subscribers: favor small, complete functional fixes. If a fix cannot fit, document findings, reproduce them safely, and prepare the implementation contract. Do not disable development flows solely to fit session scope. Establish exposure or obtain an explicit owner choice before using containment as the deliverable; deployed reachability is currently unknown.
- Do not access production data, change infrastructure, or run migrations against remote databases without explicit authorization. Never print secrets, environment values, tokens, customer payloads, or private audio URLs. Use synthetic fixtures and disposable local databases for tests.
- Owner confirms Heroku backend/PostgreSQL and Cloudinary audio. Frontend at `../roop-verma-archive-client` is authorized only for the isolated D1/D8 scope described below; normal frontend routing/runtime cutover remains gated. Intended UX is magic-email login and Stripe-hosted Checkout/Billing Portal with one monthly tier. Refresh tokens are not implemented in the reviewed flow; do not assume they exist.
- Read `BACKEND_BASELINE.md` for confirmed risks, open deployment questions, and the proposed next session. Keep findings distinct from assumptions.

## Current billing implementation — 2026-11-01

- Owner explicitly authorized and the session completed the isolated D1/D8 scope
  in `STRIPE_LED_SIGNUP_CHECKOUT_SCOPE.md`. Current handoff:
  `STRIPE_LED_PURCHASE_IMPLEMENTATION.md`. Reuses BillingOperation and identity;
  candidate signup/purchase supplies the existing paid-access adapter's binding.
  323 synthetic / 183 disposable PostgreSQL checks, 15 purchase and 23 player React
  browser assertions pass; separate known telemetry drift remains 6 pass / 1 fail.
  No further implementation, normal runtime cutover, owner controls, old-engine or
  schema removal, real provider/existing DB action, deployment, restoration,
  push or merge is authorized. Completed local slices are not operational rollout.
- `STRIPE_LED_DECISIONS.md` is policy authority: D1–D10 approved. D10 retains the
  shared PostgreSQL maximum-15-minute cache clipped to paid period, terminal
  selected-subscription veto and no stale-on-error extension. Its completed first
  slice remains documented in `PAID_ACCESS_IMPLEMENTATION.md`.
- Remaining billing transition planning is 8–14 active engineer hours: D9 controls
  3–5, bounded C1 cutover/removal 3–5 after D9, real provider verification 2–4.
  These are estimates requiring separate scope approval; owner/tool waiting time
  and unrelated delivery/deployment work are separate. Target remains zero routine
  engineering most months / roughly five hours per quarter, not yet validated.
- Owner course correction: minimizing ongoing maintenance is an architectural
  requirement. Prefer Stripe-hosted Checkout for purchase/subscription signup,
  Customer Portal for billing management, and Stripe-managed billing lifecycle.
  Keep application code for verified identity, trusted customer association and
  playback authorization; justify any additional lifecycle machinery explicitly.
  Prefer documented operator handling of rare exceptions when it avoids a complex
  automatic recovery system. Review signup/provisioning as part of this boundary.
- The existing invoice-backed implementation is a tested local candidate, not the
  required target architecture. Reassess it against this constraint before further
  expansion. Existing lifecycle tests are useful evaluation scenarios; changes to
  product access policy must be explicit rather than silently weakened to simplify
  code. Do not equate a passing test suite with architectural approval.
- Start with `BILLING_API.md` for the flow/file map and the newest `BACKEND_BASELINE.md`
  handoff. Current commands/results live in `test/README.md`; repair is in `Operations.md`.
  The approved invoice-backed lifecycle is implemented locally; delivery is still unavailable.
- The completed readability pass kept policy/schema/dependency/API behavior,
  explicit request limits, atomic customer revision/receipt/grant writes and
  operation recovery; it did not resolve the architecture/maintenance concern
  above. The strict telemetry nullability diagnostic remains separately failing.
- No real provider calls, remote migrations, hosting changes or restoration are authorized.
  Reconciliation is inspect-only by default with explicit DB/provider choices. A real-provider
  selection needs separate authorization. Status strings/customer events alone grant nothing.

## Commands and setup verified from source (2026-10-17)

- Package manager: npm, with `package-lock.json`. Scripts: `start`, `test`, `assess:identity`, and `seed`. `npm test` runs 51 passing synthetic regression checks, including the eight retained security targets. `npm run assess:identity` independently runs those eight (passing). `npm run test:identity:local` runs six real PostgreSQL checks with fake mail/Stripe. `npm run assess:schema:local` retains a separate failing whole-schema assertion for pre-existing NetworkError.errorCode nullability drift. Passing identity checks do not close other security blockers. Both require loopback binding and a compatible Node runtime. See `test/README.md`.
- `npm start` runs `nodemon index.js`; `node index.js` is the direct entry point. These start the backend and may connect to configured services; neither was run during inspection.
- `node --check <file.js>` checks syntax without executing application code. All 105 existing JS files passed on local Node v26.3.0. This does not establish runtime compatibility.
- `npm ci --ignore-scripts --no-audit --no-fund` installed the locked dependencies during the implementation session. Install scripts were disabled. Prisma client generation now passes separately; native module setup and full startup with real services remain unverified. No lint/build/CI checks are configured. The original 2-pass/8-fail baseline was reproduced before implementation on Node v24.19.0; current results are above. Historically, the locked JWT dependency fails to load on local Node v26.3.0 (`SlowBuffer` removed). Do not treat Node 26 syntax-check success as runtime compatibility. No deployment runtime was inspected.
- `npm run seed` points to missing `seeds/index.js`; do not use it as setup. `prisma/seeds/seed.js` is only a stub, and individual seed files need review before execution.
- Runtime uses CommonJS JavaScript, Express and Prisma/PostgreSQL. Legacy `migrations/` and `config/config.js` are Sequelize/MySQL remnants; do not treat them as the active migration path.
- Current required configuration: `DATABASE_URL`, `API_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `CLIENT_URL`, `RESEND_API_KEY`, `LOGIN_EMAIL_FROM`, `AUTH_RATE_LIMIT_SECRET`; cookie/proxy/PORT options are documented in `IDENTITY_API.md` and `.env.example`. Webhook signing-secret setup and verification limits are in `Operations.md`. Dotenv now loads before PORT/configuration/routes. JWT_SECRET is no longer used by identity. Never reuse deployed credentials locally.
- Prisma also references `HEROKU_POSTGRESQL_BROWN_URL` as its development shadow database. A shadow database is disposable migration scratch space; verify it is separate from every real database before any migration command.
- `migrations/migration.md` documents `npx prisma migrate dev --name <NAME>` for development and `prisma migrate deploy` for deployment. The development/shadow workflow remains unverified. Deploy was subsequently verified only against disposable local PostgreSQL. Neither command was run in the original baseline session. The identity session validated/generated the schema and replayed migrations only in disposable local PostgreSQL; no remote migration or deployed-state inspection is authorized.
