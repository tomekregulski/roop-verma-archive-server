# Working instructions

- One engineer, 2–4 hours/week; beta roughly 3–4 months from the October 2026 baseline. Development hosting budget $10–15/month; launch target under $30/month; 100 registered users would be exceptional success. No real subscribers yet (owner report).
- Establish and improve the backend baseline in small, reviewable changes. Do not broadly refactor or introduce PNPM, TypeScript, a monorepo, or hosting migrations without a concrete need.
- The baseline session permits documentation changes only. Future implementation requires a new implementation request.
- Do not access production data, change infrastructure, or run migrations against remote databases without explicit authorization. Never print secrets, environment values, tokens, customer payloads, or private audio URLs. Use synthetic fixtures and disposable local databases for tests.
- Owner confirms Heroku backend/PostgreSQL and Cloudinary audio. Frontend at `../roop-verma-archive-client` may be read only to assess backend integration; no frontend implementation work is currently authorized. Intended UX is magic-email login and Stripe-hosted Checkout/Billing Portal with one monthly tier. Refresh tokens are not implemented in the reviewed flow; do not assume they exist.
- Read `BACKEND_BASELINE.md` for confirmed risks, open deployment questions, and the proposed next session. Keep findings distinct from assumptions.

## Commands and setup verified from source (2026-10-17)

- Package manager: npm, with `package-lock.json`. `npm run` lists only `start` and `seed`; executed successfully during baseline inspection.
- `npm start` runs `nodemon index.js`; `node index.js` is the direct entry point. These start the backend and may connect to configured services; neither was run during inspection.
- `node --check <file.js>` checks syntax without executing application code. All 105 existing JS files passed on local Node v26.3.0. This does not establish runtime compatibility.
- `npm ci` is the lockfile-based installation command; not run or verified in this checkout. No `node_modules` was present. No test, lint, build, or CI checks are configured.
- `npm run seed` points to missing `seeds/index.js`; do not use it as setup. `prisma/seeds/seed.js` is only a stub, and individual seed files need review before execution.
- Runtime uses CommonJS JavaScript, Express and Prisma/PostgreSQL. Legacy `migrations/` and `config/config.js` are Sequelize/MySQL remnants; do not treat them as the active migration path.
- Required configuration names: `DATABASE_URL`, `API_KEY`, `JWT_SECRET`, `STRIPE_SECRET_KEY`, `CLIENT_URL`; optional `PORT` (default 8080). Supply `PORT` in the process environment: it is read before controller-level dotenv loading. Never reuse deployed credentials locally.
- Prisma also references `HEROKU_POSTGRESQL_BROWN_URL` as its development shadow database. A shadow database is disposable migration scratch space; verify it is separate from every real database before any migration command.
- `migrations/migration.md` documents `npx prisma migrate dev --name <NAME>` for development and `prisma migrate deploy` for deployment. These commands are source-documented, not execution-verified. No migration, validation, generation, or database command was run in the baseline session.
