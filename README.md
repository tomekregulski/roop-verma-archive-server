# Roop Verma Archive - Back End

The purpose of this project is to make the life work of late sitarist Acharya Roop Verma accessible to the many around the world who loved him, and wish to stay connected to him.

This is an unreleased audio-library backend using Express and Prisma/PostgreSQL, with audio hosted on Cloudinary. Legacy MySQL/Sequelize files are historical. The repo for the front end can be found <a href="https://github.com/tomekregulski/roop-verma-archive-client">here</a>.

There are decades' worth of concerts, classes, lectures, and miedtations. The current focus is on the concert recordings, and the rest will come over time.

In addition to audio, the project will eventually be expanded to incude other forms of media - including video, images, writings

## Backend identity development

See [CI.md](CI.md) for the separate automated regression/database check and
non-required schema diagnostic, local reproduction and pending hosted results.

Read [IDENTITY_API.md](IDENTITY_API.md) for the email login/session contract, configuration and reproducible Postman/curl walkthrough. Read [test/README.md](test/README.md) for synthetic and disposable PostgreSQL checks, and the separate failing legacy schema assessment. Use Node 24.19.0 (`.nvmrc`) and npm. `npm run demo:identity` starts a synthetic-only local API and mailbox; it sends no real email and needs no service credentials.

Browser/frontend integration and deployed behavior remain unverified. See the current handoff in [BACKEND_BASELINE.md](BACKEND_BASELINE.md) for unresolved security blockers.

## Local billing and playback entitlements

The approved Stripe-led access/cache/cancellation slice is locally implemented;
read [PAID_ACCESS_IMPLEMENTATION.md](PAID_ACCESS_IMPLEMENTATION.md) for evidence
and remaining integration dependencies. Normal runtime is unchanged.

Read [BILLING_API.md](BILLING_API.md) for durable invoice-backed billing,
[Operations.md](Operations.md) for reconciliation and deletion closure, and
[PLAYBACK_API.md](PLAYBACK_API.md) for playback. `npm run test:billing:local` runs
the expanded disposable PostgreSQL checks with synthetic Stripe/media. The separate
telemetry schema diagnostic remains failing; real Stripe, protected media and
deployed behavior remain unverified. Service restoration is deferred.
