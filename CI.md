# Backend automated verification

## Minimal pipeline

`.github/workflows/ci.yml` runs on pull requests targeting `main` and pushes to
`main` (GitHub's actual default branch, confirmed read-only on 2026-10-24).
No existing CI or checked-in deployment automation was found. The repositories
remain separate. There is no backend lint/build script to add to CI.

Two bounded Ubuntu jobs use Node **24.19.0** from `.nvmrc`, locked npm
dependencies, explicit Prisma 4.12.0 client generation, and independent
disposable PostgreSQL **18.4** service containers:

- **Backend regression and identity database**: `npm test` (including the eight
  retained security assertions and webhook authenticity checks), followed by
  `npm run test:identity:db`. No redundant independent acceptance run is needed.
- **Schema drift diagnostic (not required)**: only the strict whole-schema
  assessment, selected by Node's test-name filter. It retains its real nonzero
  exit status and writes the actual step outcome and known baseline to the run
  summary, even on failure. Setup failures also fail the job; no arbitrary error
  is swallowed or reclassified as known drift.

The diagnostic is deliberately a separate failing check. **Do not require the
diagnostic or aggregate Backend CI workflow for merging.** The passing identity
job can be independently enforced. This separation costs a small second setup
but avoids duplicating the synthetic and six database regression checks.

Each job has a ten-minute timeout. Permissions are contents-read only;
checkout credentials are not persisted. Official checkout/setup-node v6 actions
are pinned to verified release SHAs. Superseded runs for a PR/ref are cancelled.
There are no deployment jobs, production secrets or privileged PR triggers.

## Test configuration and local reproduction

Use a clean checkout with no application `.env` or real provider configuration.
Select Node via `nvm install && nvm use`, then:

```sh
npm ci --ignore-scripts --no-audit --no-fund
export NODE_ENV=test
export DATABASE_URL='postgresql://rvdl_test:synthetic-only@127.0.0.1:5432/rvdl_identity_test'
export HEROKU_POSTGRESQL_BROWN_URL='postgresql://rvdl_test:synthetic-only@127.0.0.1:5432/rvdl_identity_shadow'
node node_modules/prisma/build/index.js generate
npm test
```

For the same PostgreSQL version as CI, start a fresh container (Docker required):

```sh
docker run --detach --rm --name rvdl-ci-postgres \
  -e POSTGRES_USER=rvdl_test -e POSTGRES_PASSWORD=synthetic-only \
  -e POSTGRES_DB=rvdl_identity_test \
  -p 127.0.0.1:5432:5432 postgres:18.4
# Wait until this succeeds before running the tests:
docker exec rvdl-ci-postgres pg_isready -U rvdl_test -d rvdl_identity_test
export TEST_DATABASE_URL='postgresql://rvdl_test:synthetic-only@127.0.0.1:5432/rvdl_identity_test?connection_limit=8'
npm run test:identity:db
# Independent strict diagnostic; currently expected to fail with the drift below:
RVDL_ASSESS_FULL_SCHEMA=1 node --test \
  --test-name-pattern='^full schema assessment:' test/integration/identity.postgres.js
# Stop the disposable container even when a test fails:
docker stop rvdl-ci-postgres
```

The GitHub service health check provides startup readiness automatically.
Use another loopback host port consistently if 5432 is occupied. The test suite
refuses remote hosts, other database names and unexpected URL options. It creates
a random schema in `rvdl_identity_test`, applies all 25 migrations there, seeds
only synthetic records, checks migration replay, and drops that schema in
teardown. Container teardown discards the entire database even if the runner is
cancelled. No seed script, application entry point, remote migration or
`migrate dev` is invoked. The shadow URL is a synthetic placeholder required by
Prisma configuration; no shadow database is used by deploy/diff here.

The actual Express app and Prisma execute with injected fake email and Stripe
services; offline SDK webhook signatures remain real. The fixture bypasses
dotenv and real provider construction. No API/email/Stripe secrets are needed.
Install scripts are disabled; Prisma generation is explicit. Native bcrypt and
full real-provider application startup are not verified by these tests.

For machines without Docker, [test/README.md](test/README.md) documents the
existing optional embedded PostgreSQL runner, including its separate temporary
tool installation. `npm run test:identity:local` provisions and removes a fresh
cluster; `npm run assess:schema:local` runs six identity tests plus the strict
diagnostic. Neither installs a project dependency or touches a real database.

## Actual results — 2026-10-24

Local macOS arm64, isolated source copy without env files, freshly installed
locked dependencies and Node **24.19.0**:

| Check | Local outcome |
| --- | --- |
| `npm ci --ignore-scripts --no-audit --no-fund` | Passed; lockfile unchanged |
| Explicit locked Prisma client generation | Passed (4.12.0) |
| `npm test` | 70 passed |
| Disposable PostgreSQL 18.4 identity suite | 6 passed |
| Exact CI test-name filter for strict schema assessment | 1 failed, exit 1; Prisma diff exit 2 |
| Workflow YAML and triggers/permissions inspection | Passed |

PostgreSQL was provided by the documented temporary embedded tool
`embedded-postgres@18.4.0-beta.17`, not Docker (unavailable locally). The exact
diagnostic filter was exercised via a temporary copy of the disposable runner;
no test source or assertion in this repository was changed. The same database
suite/migration code runs in CI, but Linux service-container execution is pending.
Initial sandbox loopback/cache denials were rerun with permission; the results
above are the completed permitted runs.

**Schema outcome: confirmed existing drift.** The only reported difference is
`NetworkError.errorCode`, required in replayed migration history versus nullable
in the Prisma model (`Required to Nullable`). Identity checks pass independently.
Follow up separately: decide intended telemetry nullability, review data/history
compatibility, implement the appropriate model/migration correction, and rerun
the unchanged strict assertion. Do not accept unrelated future diagnostic
failures as this known mismatch. No schema correction is included here.

**Hosted results: pending.** No push or hosted run was performed or observed.
Local runs, YAML parsing and manual review do not prove hosted workflow success.

## Exclusions, required checks and publication

Browser orchestration stays in the frontend's optional cross-repository local
harness. It lacks a self-contained headless runner and has documented startup
cleanup/CORS reachability-control follow-ups. Full provider startup, external
email delivery, real Stripe behavior, existing-data/production migration
readiness, deployed HTTPS/proxy/cookie behavior and overall beta readiness remain
unverified. Billing lifecycle, catalog/admin and media authorization blockers
are not closed by CI. Test-readability refactoring remains deferred.

After successful hosted runs are observed and stable, suggest requiring only
**Backend regression and identity database**. Do not require **Schema drift
diagnostic (not required)** while it has the known failure. No branch-protection
or repository setting was changed.

Tracked files contain no deployment workflow, Procfile or Heroku app manifest;
current handoffs identify Heroku hosting. GitHub-connected Heroku automatic
deploys/review apps, external hooks and provider-side settings were not inspected
and remain unknown. Before authorizing publication, confirm provider production
branch, automatic deploy/review-app behavior and release/migration hooks so the
branch push/PR cannot initiate a live deployment. Publishing these separate
changes and running hosted CI require explicit authorization after that check;
no push is proposed as safe based only on the absence of tracked deploy jobs.

Configuration references checked 2026-10-24: GitHub's
[workflow syntax](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax),
[PostgreSQL service-container guide](https://docs.github.com/en/actions/tutorials/use-containerized-services/create-postgresql-service-containers),
and [setup-node documentation](https://github.com/actions/setup-node/tree/v6).
