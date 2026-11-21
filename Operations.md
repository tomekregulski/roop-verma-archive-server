# Hosted activation follow-up — 2026-11-20

Owner renewed the approved activation sequence with fresh preconditions and added
hosted verification of the completed one-recording R2 pilot. Additional hosted
playback changes must be prepared for approval before applying them. The scope
is Track.id **7** only; no broader transfer, optional renewal or public-URL
retirement. Earlier dated evidence and the seven-migration target remain intact.

## Current verified preparation

- Client `hosted-test-env` at `fec1aa2` includes pilot main `857b5c6` and activation
  work. Server rebase conflicts were resolved by preserving both handoffs and
  playback/support configuration; owner completed the rebase at `402e62f` on
  `hosted-test-env`, including pilot main `c19152c`. Subsequent wrapper changes
  below are local and uncommitted. No push or deployment was performed.
- All three public DNS values match the existing Resend domain setup, including
  the complete public DKIM key. Triggered domain verification; Resend now shows
  **Verified / Ready**. Tracking remains unconfigured. The optional root DMARC
  change was not applied.
- Rechecked exact Heroku app/add-on IDs: the approved DATABASE attachment is
  unchanged and distinct from BROWN. Web=0, no dynos. Configured the agreed
  LOGIN_EMAIL_FROM; configuration release **v165 succeeded**. One clearly labeled
  sender-delivery check to the agreed owner Gmail was accepted by Resend; inbox
  receipt was confirmed by the owner in the inbox. This contained no login proof and
  does not establish hosted login. An initial HTTP 403 refused the first request;
  retry with an explicit application user-agent and idempotency key succeeded.
- The selected Stripe price is still active, **test mode**, USD 1000 cents per
  month and the approved product. Webhook secret is still missing. No purchase
  or application-account creation has been performed.
- Primary Netlify now publishes pilot main `857b5c6`, deploy
  `6b00d9b3a168a05ecd003151`; automatic builds remain enabled. This supersedes
  the old published-commit baseline below. The activation branch still needs its
  reviewed proxy/support/runtime build. Sandbox and previews remain excluded.
- Retained private operator files exist with directory 0700/files 0600; the
  manifest contains exactly Track.id 7 and SHA-256
  `b2010707d74abc060628cd1907b8379674fd110a5131754431a141039b51e289`.
  Cloudflare's token inventory showed the retained token active, exact playback
  bucket scope and **Object Read only**. After the owner restored dashboard
  sign-in, confirmed the bucket is private (public development URL disabled,
  no custom domain), Standard/ENAM, and its existing CORS exactly matches the
  local-only GET/Range rule in the pilot. The proposed additional origin is
  staged in the unsaved CORS editor for review; no Save was clicked. No R2
  hosted configuration or CORS change has been applied. One fresh SDK HEAD
  with the retained read credential passed: 46,673,192 bytes, audio/mpeg,
  private/no-store, no compression. No audio body was downloaded.
- Schema, all 31 migrations, migration lock, original retirement SQL and all
  12 preserved historical evidence files still match their pinned hashes.
- Node 24.19.0 full synthetic backend suite: **301/301 pass**, including five
  hosted-startup checks. Providers/accounts are synthetic; loopback access was
  needed outside the sandbox. No existing database write or media fetch occurred.
- Fresh verified-TLS read-only PostgreSQL preflight matched app config to the
  provider resource endpoint and canonical attachment; shadow remains distinct.
  PostgreSQL 15.18, 24 complete checksum-matched ledger entries, 17 baseline
  tables, six users/six distinct customer references, no blank/duplicate
  normalized emails, and Token/Subscription/WebhookLog/TrackPlay/NetworkError
  all zero. Archive counts match the earlier baseline, including 74 tracks,
  aggregate plays=0/nulls=0; Track 7 remains subscriber-only, plays=0. Two C1
  predicates are zero; the other seven are absent/not evaluated until the
  intermediate schema. Exact six-account fingerprint comparison and full schema
  verification still precede any write. Transaction rolled back; no writes.
- Client's 14 unit checks and TypeScript check pass after the rebase.

## Additional hosted playback changes — prepared, awaiting approval

1. Deploy the local `Procfile` (`web: node scripts/start-hosted.js`) with the
   combined activation/pilot source. The wrapper consumes PLAYBACK_ASSETS_JSON
   only during startup, creates the destination directory at 0700, writes an
   exclusive adjacent 0600 candidate, validates using existing `readAssets`,
   refuses empty/invalid input, and atomically renames it to PLAYBACK_ASSETS_FILE.
   It then removes the JSON startup input from process.env and loads the normal
   application entry point in the same process. No mapping endpoint or schema
   change. Normal direct `npm start` remains `node index.js` and does not read
   PLAYBACK_ASSETS_JSON. The wrapper is implemented locally, not yet hosted.
2. While the existing backend remains stopped, set only these additional Heroku
   names from private operator files: PLAYBACK_ASSETS_JSON (the exact pinned
   one-entry manifest), PLAYBACK_ASSETS_FILE=/app/.playback/assets.json,
   PLAYBACK_R2_ACCOUNT_ID, PLAYBACK_R2_BUCKET=rvdl-private-playback,
   PLAYBACK_R2_JURISDICTION=default, PLAYBACK_R2_ACCESS_KEY_ID and
   PLAYBACK_R2_SECRET_ACCESS_KEY (the retained read credential). Keep all values
   server-side; no upload credential or Netlify media secret. Reverify local
   source permissions, manifest hash/ID set, provider account/bucket and read
   permission before transfer. The startup file is recreated on every dyno start;
   a one-off dyno file or temporary local file is not the durable source.
3. After current-rule inspection, add only canonical frontend origin
   https://www.roopvermalibrary.com to the existing private bucket GET/Range CORS
   rule. Preserve http://127.0.0.1:3180, GET, Range, exposed Accept-Ranges /
   Content-Range / Content-Length / ETag and 300-second max age. Exact proposed
   JSON: `scripts/hosted-playback-cors.json`. No wildcard origin, write method,
   public development URL, custom domain or additional bucket/token. Stop for
   unexpected current settings rather than overwriting unrelated rules.
4. After the original backup/retirement/seven-migration sequence and coordinated
   deployment, verify real owner/ordinary email login and Stripe test Checkout
   before playing Track.id 7 through the existing player. Check unpaid/anonymous
   denial, paid native progression, unbuffered seek, pause/resume, CORS/Range and
   existing explicit Retry. Keep two-hour links and current cache/session gates;
   other recordings stay unmapped/unavailable. Actual normal playback may
   increment Track 7's aggregate starts; preserve other catalog/media fields and
   other tracks. Complete playback before canceling only the new test subscription.
   Verify cancellation/logout deny fresh issuance; already-issued capabilities
   retain their existing expiry. No optional renewal or whole-recording claim.

Fresh backup capture/verified local restore, exact six b004 identity/fingerprint
comparison, locked retirement, staged migration guards and schema/aggregate
verification remain mandatory before deployment. The old November 7 source
archive/build manifests are superseded by the rebased source and must not be
deployed; pin a fresh combined source artifact after these local changes pass.
No further approval is needed for the original Stage 2 sequence, but the above
additional hosted playback changes await the requested concrete approval.

---

# Shared hosted TEST activation — prepared 2026-11-07

**Stage 2 approved — 2026-11-07.** The owner explicitly agreed after the
Stage 2 explanation. The approved execution plan below supersedes older
local-only holds within its exact targets and stop conditions. Provider
prerequisites are in progress; no backup capture/retrieval, application-database
write, deployment, message, account creation, charge or administrator grant has run.
This reuses the existing shared prototype; it is not launch or media readiness.

## Stage 2 progress

- Applied the approved base config to the exact Heroku app; release **v162**
  succeeded with the existing slug and web=0. Added AUTH_RATE_LIMIT_SECRET,
  SESSION_COOKIE_SECURE / SAME_SITE, TRUST_PROXY_HOPS and BILLING_PRICE_ID /
  PRODUCT_ID / CURRENCY / LIVEMODE. Values/secrets were not printed. Reverified
  the selected active USD $10/month test price/product before the PATCH.
- Public DNS is served by ns43/ns44.domaincontrol.com (GoDaddy). The approved
  auth, DKIM and return-path names currently return no records. No DNS change
  has run. No matching zone is visible through connected Netlify DNS.
- Owner entered RESEND_API_KEY privately in Heroku; presence confirmed, without
  a send. GET domains returns 403 under its restricted permissions; no broader
  key was requested. Owner signed into the in-app Resend dashboard. There were
  no domains; created approved `auth.roopvermalibrary.com`, domain ID
  `65b6e1df-7ae0-49be-9d4b-4644e6f7c194`, us-east-1, sending enabled,
  receiving and click/open tracking disabled. It remains unverified pending DNS.
- Resend currently requires TXT `resend._domainkey.auth` plus CNAME
  `rsend.auth` -> `rsend.forge.rmta.net` and `send.auth` ->
  `send.forge.rmta.net`. The provider-generated DKIM public value stays in the
  setup UI; no credentials are in those records. Its optional root `_dmarc`
  suggestion is excluded from the approved subdomain-only change. GoDaddy's
  DNS page is at login; the owner may need another domain administrator's
  access. Exact public DNS instructions were prepared in
  `/private/tmp/roop-verma-mail-dns.txt` for that administrator. No password
  sharing is needed if the administrator adds the records directly.
- Owner signed into Stripe. Dashboard context verified account
  `acct_1Jg7jKBlr8UFcXJy`, livemode=false. Card Smart Retries changed from four
  attempts/three weeks to the approved eight attempts/two weeks; reopened and
  verified persisted values. Exhausted retries already cancel subscriptions.
  Supported full-amount recurring-card disputes changed from leaving past_due
  to immediate cancellation without proration; saved and verified after reload.
  No live settings, customer/payment history or actual billing objects were touched.
  Screenshot evidence: `/private/tmp/rvdl-stripe-test-retries.png` and
  `/private/tmp/rvdl-stripe-test-disputes.png`.
- Owner requested consolidation of Help support onto Resend. Implemented locally:
  anonymous `POST /api/v1/support`, fixed server-side SUPPORT_EMAIL_TO, the existing
  Resend key/sender, validated reply-to and plain-text content. Origin/CSRF,
  16 KiB JSON limit, 100-character name / 254-character email / 5,000-character
  message bounds, five requests/IP and twenty globally per 15 minutes protect
  delivery. Counters reuse IdentityRateLimit; no support content is stored in
  application tables or ordinary logs. Provider/inbox mail retention is unchanged.
  Missing recipient/storage or uncertain provider acceptance fails closed.
- The client now requires explicit backend acceptance and retains busy/retry,
  duplicate-click and unmount guards. Removed EmailJS SDK, its public initializer,
  harness alias and obsolete SDK-specific guard tests. No EmailJS login, template
  configuration, account deletion or provider-resource cleanup is needed.
- Remap verification on Node 24.19.0: 284 backend tests (including 24 support),
  one focused PostgreSQL 15.18 test with two independent clients, 42 React browser
  checks, 14 unit checks, seven harness lifecycle checks, TypeScript, changed-file
  lint and Vite build pass. The lockfile change removes only EmailJS; no new
  runtime dependency or schema/migration change. Verified pnpm 9.1.2 accepts
  the updated lockfile with offline frozen-lockfile validation and scripts disabled.
  Real delivery remains untested
  until the sender's DNS records verify. No hosted support request was sent.
- Configured the agreed SUPPORT_EMAIL_TO privately on the exact Heroku app;
  release **v164** succeeded, web=0 and no dynos. The Resend key remains present.
  This configured the recipient only; no message, migration or deployment ran.
- No application database write, backup, retirement, migration, deployment,
  scaling, mail, Checkout or administrator provisioning has occurred. The
  provider prerequisites remain the gate before retirement; approval remains
  valid and does not need to be repeated for the approved sequence.

## Verified targets and prerequisites

| Target | Current evidence / selected change |
| --- | --- |
| Backend source | Clean initial main `8632b7a88527e33336f173203a9413a9dff01c38`; schema/migration bytes unchanged from the successful seven-migration rehearsal. Local support route/service remap is tested below. Runtime patch: Node `24.x` engines and `start: node index.js`; lockfile changes only root engines metadata. No release/migration hook. |
| Heroku | `roop-verma-archive`, app `fbcc7ce1-7840-40a7-b28b-8a1088c5ac48`; heroku-24 / Node 24.22.1 in the latest build; v161 / `f25c4158a08c092def49fa6e000e2f3262974021`; Eco web=0, no dynos, root 503. Owner confirms manual deployment; no auto-deploy investigation is needed. |
| Application database | `DATABASE`, `postgresql-angular-93273`, add-on `a6fb9b18-3798-4685-b9cb-9a8bcb96fbd5`, Essential-1, PostgreSQL **15.18**. BROWN / `postgresql-opaque-25781` is distinct and was not queried. JawsDB is not the application database. |
| Frontend source / publication | Clean initial main `bf272a0e8a72f056444495c62f64ff5bf61ecd33`; both published Netlify sites are on this commit. `rvdl-ui` site `eec20c34-5a18-4318-8467-884a09202e7c`, deploy `6aef6a758bcec03b99ba7c10`, canonical HTTPS `https://www.roopvermalibrary.com`. This is the selected shared TEST frontend. |
| Other frontend | `rvdl-ui-sb`, site `89dd51b1-df99-4f39-95da-40b50cc2f76a`, deploy `6aef6a7582d0fc2498577c68`, still targets the absent sandbox API. It is excluded from activation. Existing previews are excluded too. |
| Build | Netlify currently uses Node 18.15.0; main command `CI= pnpm build`, publish `dist`, main auto-builds enabled. Prepared `.nvmrc` / TOML select Node 24.19.0, pinned pnpm 9.1.2, `pnpm build`, `dist`. No framework/SDK/dependency upgrade. |

Read-only SQL used an independently reverified application attachment, AWS RDS
CA/hostname verification, `default_transaction_read_only=on`, repeatable-read
transactions, 5s statement / 1s lock timeouts and rollback. There are 17 baseline
tables and **24 complete checksum-matched historical migrations**, no failed,
rolled-back or logged migration entries. Modern identity/billing tables are
absent. Counts: User=6, six distinct nonempty customer references, Token=0,
Subscription=0, WebhookLog=0, TrackPlay=0, NetworkError=0; no duplicate normalized
emails, blank emails, orphan Tokens or unexpected incoming retirement FKs.
Archive counts: Track=74, plays sum=0, null plays=0; Artist=12, Category=13,
Event=46, Location=17, MediaType=4, Raga=369, Tape=46, TrackArtist=34, Tribute=0.
The old required NetworkError.errorCode column is present as expected. The
current columns/defaults, constraints and indexes exactly match a fresh
24-migration PostgreSQL 15.18 baseline, with zero custom triggers/RLS tables;
provider resource endpoint and application connection match privately.

Only two C1 guards can currently evaluate (Subscription/WebhookLog, both zero);
the other seven require intermediate schema. They **must all evaluate zero after
forward migration five**, before C1. Six accounts by count does not prove the
same exact six reviewed identities: Stage 2 must compare their exact ID/customer
pairs to the pinned b004 privately, never derive a deletion set from count/email.

All 43 pinned file hashes and 12 historical evidence hashes matched before the
activation edits. The later owner-requested support remap changes application
routing/mail code and client dependencies, without changing schema or migration
bytes. The pinned manifests/results and original retirement SQL remain untouched.
Backend lockfile changes only root runtime metadata; the client lock removes
only EmailJS. The support remap does not require repeating the account/migration
rehearsal; source/archive hashes below supersede the earlier activation archive.

## Prepared configuration and service choices

- **Browser:** canonical frontend only, with `VITE_API_ORIGIN=""` and the prepared
  hostname-specific Netlify `/api/*` → Heroku `/api/:splat` proxy before the SPA
  rewrite. Preview/branch builds use a reserved unavailable origin. The proxy
  does not match sandbox, preview or alternate netlify.app hosts. Keep
  `CLIENT_URL=https://www.roopvermalibrary.com`, `SESSION_COOKIE_SECURE=true`,
  `SESSION_COOKIE_SAME_SITE=lax`. This uses first-party host-only
  `__Host-rv-session` cookies without an API-domain/DNS migration. Hosted cookie
  forwarding and no-store behavior are mandatory acceptance checks, not yet
  proven. `TRUST_PROXY_HOPS=1` trusts only Heroku's appended immediate upstream;
  proxied traffic can share a Netlify egress IP/rate bucket. Do not increase to
  two hops to recover a browser IP while direct Heroku access remains possible.
- **Required server configuration:** retain verified DATABASE_URL / API_KEY /
  test STRIPE_SECRET_KEY; add AUTH_RATE_LIMIT_SECRET (fresh random >=32 characters),
  RESEND_API_KEY, LOGIN_EMAIL_FROM, SUPPORT_EMAIL_TO, STRIPE_WEBHOOK_SECRET and the billing allowlist
  below. Missing names were verified, not inferred. Frontend API_KEY matches the
  backend privately; no value was printed. Keep all provider credentials server-side.
- **Approved Stripe TEST tier:** reuse the active archive-named
  monthly USD **$10** price `price_1KJRMLBlr8UFcXJyfuwrkYVC`, product
  `prod_KzQCL1X4RbxnFC`; set BILLING_PRICE_ID / BILLING_PRODUCT_ID accordingly,
  BILLING_CURRENCY=usd, BILLING_LIVEMODE=false. Other old test prices remain
  untouched. The deployed legacy code used a daily test price; that is not the
  intended monthly tier or an association to backfill.
- **Stripe webhook:** existing enabled test endpoint
  `we_1OEBqEBlr8UFcXJyNTVoBve0` has no Checkout-completion subscription and no
  pinned API version. During maintenance, disable it and create one replacement
  test endpoint at `https://roop-verma-archive.herokuapp.com/api/v1/payment/webhooks`,
  pinned to `2024-12-18.acacia`, for `checkout.session.completed` and
  `customer.subscription.deleted`. Store its creation-only signing secret directly
  in Heroku without output. Leave the already-disabled ngrok endpoint untouched.
- **Portal/recovery:** existing default test Portal
  `bpc_1MfqFLBlr8UFcXJy0BZl1CV5` already enables payment-method changes, invoice
  history and period-end cancellation without proration; pause/update are disabled.
  App return URLs are derived from CLIENT_URL (`/manage-account` and
  `/complete-registration?success=true&session_id={CHECKOUT_SESSION_ID}`). Verify
  the test Dashboard recovery setting and deliberately select eight Smart Retry
  attempts within two weeks, then **cancel**, and the approved supported-dispute
  cancellation without proration. Stop if these settings cannot be selected in
  the intended test context or would affect live settings. No live setting change.
  The approved test-mode retry/dispute values are now saved and verified as
  recorded above; no live setting was changed.
- **Mail/inboxes:** owner/support `tomek.regulski@gmail.com`; ordinary test user
  `tomek.regulski+rvdl-test@gmail.com` (one Gmail inbox, two app identities).
  Owner entered the sending-only key in Heroku. The approved sender is:
  `Roop Verma Library <login@auth.roopvermalibrary.com>`. Stage 2 may verify that
  sending subdomain and add only required Resend DNS records under it (including
  its DKIM/return-path names), stopping on conflicts; leave root MX/SPF and other
  records unchanged. No matching DNS zone is visible in the connected Netlify
  account, so the owner must supply DNS-provider access or enter those records.
  Disable click/open tracking for login links. Owner enters the sending-only key
  privately into Heroku; never into chat or the repository. Resend's default
  resend.dev sender is insufficient for arbitrary recipients/aliases.
- **Support:** use the new backend Resend route; configure
  SUPPORT_EMAIL_TO=tomek.regulski@gmail.com on the server, with the same verified
  LOGIN_EMAIL_FROM / RESEND_API_KEY as login. Set frontend VITE_RVDL_EMAIL_ADDRESS
  to the same public contact address. The browser cannot choose recipient, sender,
  headers, template or HTML. No EmailJS dependency/configuration remains in the
  current client. Acceptance does not prove inbox delivery. A submitted reply-to
  address alone is not proof of account ownership for deletion; the existing
  manual identity/support verification still applies. Agent inbox access is
  unnecessary, and login links must not be pasted into chat.

Provider metadata access or owner-assisted Dashboard/DNS/key entry is needed for
the explicit mail/support/recovery steps. Do these **before retiring accounts**;
if unavailable, stop with that blocker and keep the shared database unchanged.


Prepared client patch SHA-256: `.nvmrc` `7e8a2fa94951112b894a3dbe3d05efef5e9263741fa49125f0a70f40fedab4cc`;
`netlify.toml` `2030e22a677bb14bd81c3ed7182d6d57a437d3c77d697d4e6a57374e6d799d84`.
Prepared owner SQL SHA-256: `f435bc4a72da3a7a9e96d54d3f1eea81535a332fec8f712fd91c30b9491e4dc5`.

Current Resend client source manifest: `/private/tmp/rvdl-support-client-source-manifest.json`,
SHA-256 `7d4fd377aabf6ce6f2636d22ae1e5167c05affe53a6225f2f7f0d45255886390`. It pins the six
production/build files changed from client main, including the API adapter and
SupportForm. The server archive includes all current source/config/test overlays;
its Operations.md remains the Git baseline to avoid a self-referencing archive hash.

## Approved Stage 2 execution order

1. Reverify the exact source/patch hashes, provider app/site/add-on IDs, test mode,
   schema/ledger/counts and absence of other writers. Complete the finite provider
   prerequisites above; no account/billing-history discovery. Keep old web=0.
2. `heroku maintenance:on --app roop-verma-archive`; explicitly retain
   `heroku ps:scale web=0 --app roop-verma-archive`. Confirm no worker/one-off dynos
   or manual SQL writers; owner coordinates a no-write window through verification.
3. `heroku pg:backups:capture DATABASE --app roop-verma-archive`. Require a new
   successful DATABASE-source backup with zero warnings, capture time after the
   writer stop and nonzero size. Retrieve its exact artifact privately, record
   hash/size/identity, inspect its archive and verify a single-transaction restore
   into a fresh protected local PostgreSQL 15 cluster. No shadow, existing local
   database, public signed URL or unverified substitute. Current b004 remains on
   Heroku; no recurring schedule exists and this plan adds none.
4. Retrieve only pinned b004 (`e4ce90f3-e806-4c89-b179-5745ed9bf3e6`, 52,713 bytes,
   SHA-256 `16b6a1439bf82e206621d04873146380cb595f193c04e35a8e2d3e79d3759539`)
   to establish its exact six private `(id,stripeId)` pairs. Compare those pairs
   and full-row private fingerprints to the fresh snapshot/current target before
   deleting anything; stop on any changed account field. Do not repeat
   the full b004 migration rehearsal. Remove both protected local copies afterward.
5. Prepare the hosted adapter with compatible Python:

   ```sh
   python3 scripts/prepare-hosted-retirement.py --output "$RVDL_PRIVATE_DIR/retirement.sql"
   ```

   `$RVDL_PRIVATE_DIR` is a fresh owner-only temporary directory. The generator
   verifies the original retirement SHA-256. Its only adaptations are a
   parameterized exact database name/OID + application-name/TCP target preamble,
   and locked global empty-TrackPlay/NetworkError plus unchanged-account fingerprint
   guards before any deletion.
   The original scoped deletion/preservation transaction remains. Prepared SQL
   SHA-256: `923b3ffa2a35628e85b08108fc48fa7fc5aa85920ae6254b4b14d267cc24d1de`.
   Privately reverify the provider mapping and expected database/OID; set
   PGAPPNAME=rvdl-hosted-test-retirement and libpq verified-TLS connection fields
   in the child environment. Feed `rvdl_expected_database`,
   `rvdl_expected_database_oid` and pg_temp.retirement_targets with exactly the
   six b004 pairs plus a private `userFingerprint` column (MD5 of the full b004
   User row JSON; operational change detection, not adversarial authentication)
   into the **same** `psql -X -v ON_ERROR_STOP=1` stdin session,
   followed by the generated SQL. Suppress raw output/diagnostics. Require
   six User / zero Token / zero TrackPlay deletions and unchanged protected data.
   Never invoke the pinned local-only SQL directly on Heroku or broaden targets.
6. With web still zero, stage the 24 historical migrations plus each successive
   prefix of the seven forward names in the pinned revised manifest. Copy the
   schema into each private stage with the unused shadow datasource setting
   omitted; do not edit repository schema/migrations. Run the locked command
   `node node_modules/prisma/build/index.js migrate deploy --schema "$RVDL_STAGE/schema.prisma"`
   with only the verified application URL in its private environment and no
   shadow/app/provider startup. After stage five require all nine reviewed C1
   predicates evaluated zero. Before stage seven recheck both global stores zero.
   After every stage verify the ledger prefix/checksums and private preservation
   fingerprints/counts; stop on any failure, drift or NOT EVALUATED required guard.
   Final expectations: 31 complete matching entries, strict schema match, removed
   stores/columns absent, User=0, no fabricated billing selection, preserved 74
   tracks/totals/catalog/media/tributes and retained sequence state.
7. Only after the final schema passes, deploy the prepared server archive through
   Heroku's source-upload/build API (no Git commit/push/merge required). Base commit
   is the server main above, overlaid only with package.json, package-lock.json and
   the tested support route/service, fixture/tests, configuration example and
   prepared retirement/owner SQL tools. Archive `/private/tmp/rvdl-server-hosted-test-source.tar.gz`,
   SHA-256 `f1824fa438012752a29b1303f9e46fbc78263600304650f98c16f218871ac090`.
   No .env/node_modules/generated data are included. Supply configuration privately,
   require a successful build/release and generated locked Prisma client, confirm
   Node 24.x and start command, then scale the existing Eco web to one and remove
   maintenance. No infrastructure plan/add-on purchase, new app or release migration.
8. Pause automatic builds only for `rvdl-ui` (`stop_builds=true`, currently
   false) so an unmerged main build cannot overwrite the manual TEST artifact.
   Build/deploy only `rvdl-ui` from client main plus the reviewed runtime/proxy and tested Resend support patch,
   using Node 24.19.0 / pnpm 9.1.2 and the authenticated site's public build values.
   Command: `netlify deploy --prod --no-build --site eec20c34-5a18-4318-8467-884a09202e7c --dir "$RVDL_CLIENT_BUILD"`
   from the client root, after building/type-checking the same source with empty
   VITE_API_ORIGIN into that directory. CLI bundles the reviewed TOML redirects.
   Verify the published deploy/config; do not publish sandbox/previews or push
   main, which would auto-build both sites. This manual artifact must not be
   overwritten by an unrelated auto-build during the test window.
9. Before mail/purchase, verify canonical HTTPS routing, JSON API responses,
   credentials/CSRF/origin checks, no-store and no shared caching of account
   responses. Then normal signup/login to the two designated addresses; owner
   opens actual inbox links. Verify reload/session, logout, reused-link rejection
   and ordinary-user owner denial. Only after the owner's normal email-proof login,
   atomically grant isAdmin to exactly that fresh account ID + matching owner
   email, using prepared `scripts/provision-hosted-test-owner.sql` in a verified-TLS
   `psql -X -v ON_ERROR_STOP=1` session with private expected database/OID and
   `rvdl_owner_user_id`, PGAPPNAME=rvdl-hosted-test-owner. Its normal account
   lock requires a current unrevoked session, delivered proof consumed within
   15 minutes, no pending deletion and no existing administrator; otherwise it
   refuses. Require exactly one changed row and leave the alias unprivileged. Reverify
   persisted admin access through the normal protected owner route.
10. Perform one intended Stripe **test-mode** Checkout with Stripe's published
    successful test card; verify owned return + signed completion, duplicate-safe
    retries and trusted Portal. Send one clearly marked synthetic support message;
    verify acceptance and owner-confirmed receipt. Check cookie persistence with
    third-party cookies blocked. Record only aggregate/status evidence and exact
    new test-resource references privately. Clean up only the newly created test
    subscription (explicit test-mode cancellation, no refund/history sweep) after
    verification; record any leftover test objects. Keep fresh app accounts for
    shared testing. Protected media may continue to deny access.

## Validation, stop conditions and recovery limits

Current remap results are recorded above. Earlier Stage 1 Node 24.19.0 checks:
**260/260 synthetic backend checks**, **21/21 existing C1 /
simplification PostgreSQL 15.18 checks**, frontend TypeScript and same-origin Vite
build pass. Netlify's actual redirect parser/matcher passes canonical proxy plus
alternate/sandbox/preview non-proxy cases. The hosted adapter's synthetic PG15
checks pass wrong-OID and changed-account refusal, both nonempty-store
refusal/rollback, exact six
retirement/preservation, guarded owner provisioning/ordinary-alias refusal,
all nine C1 predicates and seven forward stages with
31 checksum-matched entries and strict final schema match. Test clusters exited
and were removed. An initial disposable launcher blocked its own PG log draining;
its run was invalidated, cleaned up and rerun asynchronously; no application or
historical test source changed. Existing bundle/browser-data warnings remain.

Stop for changed accounts/schema/checksums, unexpected records, nonempty stores,
unknown billing selection, wrong/live mode, backup/restore failure, missing
provider/DNS access, incompatible runtime/schema, missing required guards or
failed signature/cookie/owner isolation checks. Do not clear records, bypass a
guard, mark a failed migration applied or proceed with the old schema.

Before retirement commits, rollback leaves the database unchanged. After it or
any migration commits, retain maintenance/web=0 on failure and report the exact
completed prefix; do not repeatedly retry or run old code. Redeploying v161 does
not reverse schema changes and was already incompatible with the unmigrated
identity schema. Full restoration of the fresh verified backup is a separate
owner recovery decision, never an automatic broad reset; it loses later writes
and does not undo Stripe/mail actions. After hosted testing, stop compute if
isolation fails; do not erase newly created billing/account evidence to recover.
Restore Netlify automatic builds only after the proxy/runtime patch is present
in the separately approved Git source. DNS/provider settings can be reversed
individually; retained backups/tombstones
are not an erasure guarantee. No live charges, public launch, paid additions or
private-media shortcut is approved.

Technical references: [Heroku Node support](https://devcenter.heroku.com/articles/nodejs-support),
[Heroku proxy headers](https://devcenter.heroku.com/articles/http-routing#heroku-headers),
[Netlify proxies](https://docs.netlify.com/manage/routing/redirects/rewrites-proxies/),
[Netlify caching](https://docs.netlify.com/build/caching/caching-overview/),
[Stripe retry outcomes](https://docs.stripe.com/billing/revenue-recovery/smart-retries),
[Resend recipient restrictions](https://resend.com/docs/knowledge-base/403-error-resend-dev-domain).

---

# One-recording R2 pilot — verified, 2026-11-16

[Results, retained configuration and hosted integration contract](ONE_RECORDING_R2_PILOT.md):
existing subscriber Track.id **7** (catalog number 15), Chandrakaunsi Kanada,
1979-01-27, Yoga Society of Florida; catalog artist Kevin West Milburn. Exact
versioned Cloudinary MP3 HEAD: 200, audio/mpeg, 46,673,192 bytes, v1650679366.
Owner-approved exact copy is now retained in **rvdl-private-playback**, private
R2 Standard/ENAM, audio/mpeg, private/no-store; duration **19:26.8**. Create-only
upload and complete read-back SHA-256 match passed. Existing-player playback,
unbuffered forward/back seeks, pause/resume, explicit Retry after fixture-only
503, browser range/CORS, subscriber denials and unsigned/write/delete denials
passed. Synthetic cancellation/revocation denied fresh issuance. Final read-only
application-DB snapshot, visibility, source reference and **plays=0 unchanged**.
Read-only exact-bucket token and one-entry ID-7 manifest/configuration retained
privately at `~/.config/rvdl/private-playback` (0700/0600). Temporary uploader
revoked (SDK HEAD now 401), downloads/raw locators/temp credentials removed and
local processes stopped. Expected ongoing R2 cost $0 within shared allowances;
no hard spending cap. Twelve existing focused synthetic checks plus the separate
primary-ID regression, client types/touched fixture lint/launcher syntax pass.
Hosted configuration/materialization/deployment remain instructions only, with
no change to the separate activation/schema/migration sequence. Server PR #70
and client PR #109 are merged in the inspected checkouts; older unstaged-state
descriptions below are historical. Prior generated-sample expiry/completion
evidence is separate. No whole-recording completion, hosted login/playback,
library migration, legacy-URL retirement or archival-preservation claim.

# Private sample delivery — revised scope, 2026-11-14

Securely fetch/play one sample through the existing player. Keep two-hour links
and explicit Retry. Most recordings are 15–45 minutes. Automatic renewal,
seamless position restoration and background-tab recovery are excluded unless
ordinary-listening tests demonstrate a material failure and the owner approves
a proportionate fix. The completed expanded client work remains preserved in its
own worktree; it is not the activation candidate.

At the owner's request, current scoped changes are now **unstaged on main** in
`/Users/tomekregulski/Desktop/rvdl/roop-verma-archive-server` (baseline `8632b7a`)
and `/Users/tomekregulski/Desktop/rvdl/roop-verma-archive-client` (baseline `bf272a0`).
Server changes supply the manifest/private R2 adapters and SDK. Client changes are
the handoff, isolated synthetic/provider test tooling and the owner-approved
2026-11-15 ended-state fix. No branch switch, staging, commit, push, PR or
deployment occurred.

The isolated server and minimal client worktrees remain as source copies.
Expanded client renewal work remains at `/private/tmp/rvdl-private-audio-client`;
pre-revision server files are also preserved at
`/private/tmp/rvdl-private-audio-preserved/server-before-scope-tightening.zip`.

Use one private playback-only Standard bucket and a bucket-scoped Object Read
credential. Keep archive originals elsewhere and uploader credentials outside the
app. Deploy an operator-owned manifest mapping exact Track primary IDs to
`playback/<sha256>.mp3`; compute digests locally, create objects with
`If-None-Match: *`, `Content-Type: audio/mpeg`, no compression, and
`Cache-Control: private, no-store`. Never overwrite keys. Mapping updates require
a reviewed manifest replacement and restart; they do not revoke prior URLs.
No signed URLs, credentials or private locators belong in ordinary logs/evidence.

[PLAYBACK_API.md](PLAYBACK_API.md) describes fail-closed configuration and final
session/status validation. The two-hour capability and 15-minute status-cache
limits remain; active/past_due and terminal cancellation policy are unchanged.
[The provider report](PRIVATE_AUDIO_PROVIDER_CHECK.md) records the owner's separate
approval and actual isolated R2 test: SDK range/CORS/read-only/tampering/expiry
checks and existing-player playback/seeking/pause/resume/Retry/full 15-minute
listen pass. Approved cleanup completed. The observed end-of-track UI issue was
fixed on 2026-11-15 with a focused regression (29 React assertions / 14 unit
checks, types/lint/build pass). Completion stops at the selected track without
automatic continuation or renewal. That client-only follow-up made no provider
calls. The R2 check used generated audio and synthetic local
identity/billing only. Email DNS is independent; real archive/DB/hosted actions
still need separate authorization. Test approval is not public activation.

**Public-activation follow-up (owner noted; excluded from private test):** review
playback-access rate limiting using the existing limiter plus a low budget alert.
Successful HEAD/GET requests can accrue fees; valid links can be reused until
expiry even if issuance stops. This is risk reduction, not a hard R2 spending cap.
Proceed with the approved private sample test without adding these mechanisms.

**SDK maintenance/compatibility:** @aws-sdk/client-s3 and s3-request-presigner
3.1169.0, recommended in Cloudflare's official S3 example, require Node >=20 and
pass on pinned Node 24.19.0. They add 27 locked packages / about 8.7 MB of package
files, change no existing package versions, and add no browser bundle dependency.
They handle request authentication/signing; manifest validation uses Node built-ins,
with no dependency for trivial helpers. The independent SigV4 verifier is test-only.

**Activation coordination (copyable; not sent):** no model, migration, historical
results or rehearsal manifest changed; the seven-migration sequence is intact.
Separate server draft `cfac252` adds support/hosted work: merge both additions in
Operations.md, test/README.md, .env.example and package/lock files. Client draft
`47fc9c7` changes support/harness/runtime setup; designer work through `7f8e53d`
remains untouched. No playback API/schema conflict or copied draft changes.
Production storage config/manifest/token/CORS and hosted HTTPS/cookie verification
remain activation dependencies; isolated test results do not configure hosted
runtime. Login-email DNS/deployment
and public-URL retirement are separate. Preexisting work and current branch selections remain
unchanged; scoped files are visible as ordinary unstaged changes. Existing DB
access, actual archive/provider actions outside the approved sample and rollout
remain gated.

---

# Earlier local Stripe-led operations — bounded simplification, 2026-11-07

**Local revision only.** The owner authorized this simplification with fake
providers and fresh disposable PostgreSQL. No existing/remote database, actual
backup, real provider, deployment or restoration action is authorized. The b004
rehearsal indexed in [REHEARSAL_EVIDENCE_INDEX.json](REHEARSAL_EVIDENCE_INDEX.json)
is preserved and applies only to its pinned six-migration target. Rehearse the
new seven-migration sequence before any separately authorized rollout.

Normal backend/frontend composition selects purchase, paid access and owner-assisted
account deletion. Stripe owns Checkout, Portal, recurring billing and configured
recovery. Owners use Dashboard/support for rare financial exceptions. Customer deletion contact uses the existing Help/EmailJS support form; there is no deletion notification configuration. There is
no reconciliation CLI, daily application reconciliation, grant/financial-history
repair, generic operation recovery sweep or receipt-log monitoring procedure.
[BILLING_API.md](BILLING_API.md) maps the one normal path; current verification and
reduction are in [STRIPE_LED_PURCHASE_IMPLEMENTATION.md](STRIPE_LED_PURCHASE_IMPLEMENTATION.md).
No real provider, existing database, deployment or private delivery was exercised.

## Activation dependencies — separately authorized work

- Preserve reviewed D1–D10 settings: one positive monthly card tier, no trial/
  discount/credit purchase features; Checkout return URLs, Portal period-end cancellation,
  recurring recovery and supported dispute cancellation configuration. Active and
  past_due allow access; indefinitely past_due can leave access enabled indefinitely.
  Review Stripe recovery/retry and eventual cancellation settings before activation. Verify the
  pinned Stripe 17.5.0 / Acacia request, expansion, event and retry shapes in a
  designated real test environment. Local fakes establish none of those settings.
- Supply DATABASE_URL and separately disposable shadow URL only under authorized
  deployment procedures; API_KEY, CLIENT_URL, AUTH_RATE_LIMIT_SECRET, cookie/proxy
  settings, Stripe API key, endpoint-specific STRIPE_WEBHOOK_SECRET, explicit
  BILLING_PRICE_ID / BILLING_PRODUCT_ID / BILLING_CURRENCY / BILLING_LIVEMODE,
  RESEND_API_KEY and LOGIN_EMAIL_FROM. See `.env.example` / `IDENTITY_API.md`.
- Establish the intended owner's verified persisted identity/current isAdmin role
  through a separately approved process. `/owner/deletions` is now normally routed;
  frontend development AdminLogin does not supply authority. Agree support contact,
  response expectations and applicable retention policy; no SLA is promised.
- Complete the existing-data preflight below before migration/activation. Stop old
  writers and coordinate schema/client rollout; the new generated client requires
  the complete forward schema. Do not run new code on an unmigrated database or
  old provisioning/recovery beside new deletion. No mixed-version deployment is verified.
- Actual media mapping/signing, public-URL retirement, streaming/expiry verification,
  deployed HTTPS/proxy/cookies, restoration and launch approval remain separate.

## Existing-data preflight and retention blockers

The explicitly authorized 2026-11-07 isolated cleanup/migration rehearsal
**passed**: [TEST_ACCOUNT_RETIREMENT_RESULTS.md](TEST_ACCOUNT_RETIREMENT_RESULTS.md).
Six local test users were retired; no matching auth/listening rows existed.
Archive content stayed unchanged, all nine C1 guards were zero and all six
migrations completed with 30 checksum-matched ledger entries. The temporary
copies were removed. This is local snapshot evidence, not live cleanup or rollout
approval. Fresh signup/verified-owner admin provisioning remain separately gated.

Owner clarified that nobody has paid and the six legacy accounts belong to
owners/friends, and accepted retiring them for fresh workflow testing. The
[targeted test-account retirement plan](TEST_ACCOUNT_RETIREMENT_REHEARSAL.md)
supersedes the earlier preserve/reconcile proposal for those accounts. Cleanup
was executed only on the isolated copy as recorded above; any live cleanup or
rollout remains separate. No live deletion occurred; archive content and media
stay preserved.

The subsequent owner-authorized local rehearsal completed on 2026-11-06:
[C1_REHEARSAL_RESULTS.md](C1_REHEARSAL_RESULTS.md). Six historical users produced
six mode-unknown, unselected associations after the five intermediate migrations;
both C1 selection guards counted six. Final C1 was not run, and every temporary
copy was removed. Account-transition policy/design is now the concrete blocker;
no association/selection/retention change or deployed migration is approved.

The owner-authorized 2026-11-06 isolated b004 inspection is recorded in
[C1_PREFLIGHT_RESULTS.md](C1_PREFLIGHT_RESULTS.md): historical Subscription and
WebhookLog are empty, but newer billing/identity schema is absent and C1's full
transition is not yet verified. The copy was removed. Current live contents and
trusted-association disposition remain unknown. Any further backup access or
migration rehearsal needs separate authorization; decide disposition from the
separately reviewed evidence:

| Removed structure | Required condition / treatment |
| --- | --- |
| CheckoutOwnership | **Zero rows**. Every row, even one matching an attempt, blocks migration. Investigate exact ownership/Checkout closure first; never erase unresolved evidence to bypass D9. |
| Historical Subscription and PaidInvoiceGrant | **Zero rows**. Owner-approved retention/disposition is required for any historical mirror/grant; no financial selection or conversion is inferred. |
| StripeEventReceipt and WebhookLog | **Zero rows**, including applied/ignored receipts. Owner must decide audit retention/disposition; pending/review outcomes need investigation. |
| BillingOperation | Keep owned immutable v2 Checkout attempts and deleted security tombstones. Registration, old parameter formats or live orphan attempts block migration; do not rewrite/scrub live parameters or assign ownership. |
| BillingCustomer legacy flags | No deletionRequestedAt, syncIssueCode or reconcileCursor evidence. Investigate flags, keep terminal stripeDeletedAt/deletedAt tombstones, and resolve pending requests without silently losing them. |
| Trusted selection | Every live association must have exact matching User/customer ownership, known mode and a securely established selection. No selection backfill exists. Ambiguous emails/associations or unsupported arrangements require owner/engineering review. |
| Removed metadata | User.subscriptionActive is display-only; BillingCustomer revision, lastSyncedAt and lastFullScanAt are obsolete old-engine coordination timestamps/counters. Their removal does not grant access. |

The migration locks affected tables, checks these conditions, and drops only empty
legacy tables. It does not delete legacy rows, export/archive them, choose a
retention period, reassign ownership or reconstruct history. Populated fixtures
prove refusal/rollback, not compatibility with unknown existing records. Owner
retention decisions and any supported-data investigation are concrete blockers to
applying this migration if those cases exist. Resolve them in separately scoped,
reviewed work before activation; do not disable the guards. Prisma 4 may mask a
transactional refusal as `current transaction is aborted`; the DO precondition
block can be checked independently in the separately authorized disposable copy.
Never repeatedly apply a failed migration to an existing DB or manually mark it
applied to bypass review. Historical migration files remain unchanged.

## Owner-assisted deletion

Customers contact support through the existing Help form. Verify that the
request belongs to the account using the existing login/account identity process
and manual support correspondence; knowing an email alone is not proof of request
ownership. Do not invent another proof/token system or use Stripe billing email
to change login identity. No response-time promise is approved.

A persisted administrator opens `/owner/deletions`, enters the exact app account
ID (shown as the signed-in customer’s account reference; the existing protected
administrator user list is also available) and matching account
email, attests verified request ownership and chooses **Start account deletion**.
The transaction rechecks administrator authority under the target account lock.
This blocks new purchases/association while retaining login, trusted Portal and
ordinary playback policy. Repeated initiation is safe. Reopen one exact account
review by ID after a reload; no pending queue or automatic email exists. **Abandon
support deletion** requires a fresh review and clears the purchase block without
changing Stripe. Customer cancellation in Portal leaves the app account intact.

Before **Complete app account deletion**, review the correct account and:

1. Verify the exact Stripe mode, trusted customer and every owned Checkout attempt.
   Email alone is insufficient; include inactive attempts and unassociated results.
2. Resolve each Checkout outcome. Open Sessions must close/expire. Unknown/missing
   Session IDs, old attempts, absent bindings, timeouts or missing webhooks do not
   prove no purchase. For a lost ID, enter only an exact Dashboard Session matching
   the retained immutable attempt metadata/mode/ownership. No fresh Checkout or
   broad provider-history discovery is used. Unknown cases stay pending and may
   require engineering; do not delete the attempt to bypass a blocker.
3. Review **all** subscriptions and duplicates, including unassociated ones.
   Normal period-end cancellation means wait for actual closure; a scheduled
   cancellation alone cannot complete deletion.
4. Review schedules, draft/open invoices, retries and pending invoice items. Make
   an explicit Dashboard disposition for every item; the app does not inspect or
   reconstruct these financial histories.
5. Apply approved D3–D8 exceptions: refund alone does not cancel or revoke ordinary
   access; refund-and-end-service needs explicit cancellation. Handle partial
   refunds, disputes, duplicate cleanup and any agreed compensation in Dashboard /
   support. There is no automatic restoration, refund or entitlement editor.
6. Recheck Dashboard immediately before attesting actual closure. Completion does
   fresh exact reads and rejects stale local review, open/unknown outcomes or
   ongoing known subscriptions. Provider trouble blocks completion; local review
   still permits support withdrawal. Refresh/review after any stale or ambiguous
   result before retrying. A repeated completed request never recreates identity.

Completion atomically deletes User, sessions/login proofs and legacy Token rows.
It preserves aggregate Track.plays, catalog, tributes and media references; clears
access evidence; retains customer/subscription/attempt security tombstones without
automatic expiry; and removes names/email/request JSON from deleted live-v2 app
attempts. The guarded simplification migration must already have removed empty
TrackPlay and NetworkError stores; nonempty records require separately approved
disposition before migration, not runtime deletion or diagnostic scrubbing.
Unknown encodings, arbitrary author text, provider mail, logs and backups are not
an erasure guarantee or a new retention policy. Unsupported immutable attempts
still block completion pending investigation.

Stripe customers, payments, invoices, refunds and other financial records remain.
App deletion does not immediately invalidate issued media URLs (up to their
existing expiry). Late callbacks cannot recreate identity or associate
retained billing with a later same-email account. The old provisioning/recovery paths have been removed by C1.

## Financial exceptions and outage behavior

Customers cancel at period end in Portal and keep their paid remainder. An actual
canceled subscription vetoes new paid playback. For refund-only, explicitly leave
renewal/access unchanged; refund-and-end-service requires explicit immediate
cancellation plus refund in Dashboard. Partial refunds, unsupported disputes,
duplicates and agreed compensation are owner/support work. Won/withdrawn disputes
do not restore canceled access/time automatically; an agreed new purchase charges
again. No app cancellation, refund or restoration endpoint exists.

A cold/expired access cache fails closed during Stripe or DB outages. Valid cache
hits remain usable only to their fixed deadline; errors/retries never extend it.
For uncertain purchases, reuse only the owned same-key attempt within its safe
window; old unknown outcomes stay at help for exact investigation. Do not create
another Checkout key or guess by email to clear a blocker.

## Webhook authenticity and verification

`POST /api/v1/payment/webhooks` consumes original raw JSON before shared parsing,
with the existing 16 KiB limit and compression rejection. Configure the exact
endpoint/environment's signing secret, separately from the API key. The SDK
verifies bytes/header and default timestamp tolerance before dispatch. Missing
secret is 503; missing/invalid/stale/tampered signatures are 400 with no service
work. Do not log credentials, signatures, provider bodies or private media URLs.

Separately verify deployed HTTPS/proxy/header preservation, clock, snapshot/API
version, subscribed `checkout.session.completed` / `customer.subscription.deleted`
events and genuine payload sizes. Unknown notifications do no provisioning or
ledger work. Cookie ownership, signed events and provider email are distinct
trust boundaries. Current status/association checks, cache/veto, final playback
checks and transactional tombstones remain necessary.

## Aggregate listens and failure diagnostics

A listen means actual HTML audio `playing` begins, once per track selection and
account/session state in the mounted player. Pause/resume, buffering events,
rerenders and URL renewal do not increment again. Selecting away/back, another
tab or a new page/session can count again. Counts are approximate starts, not
unique people or completed recordings. Failed browser play and URL issuance do
not count. Telemetry failures are best effort with no automatic retry; they do
not interrupt playback. No individual duration/history or listener ID is stored.
`POST /track/:trackId/listen/:key` accepts only empty JSON, validates the ID,
enforces origin/CSRF and the existing keyed expiring IP rate limit (120/15m), then
atomically increments `COALESCE(plays,0)+1`. It grants no media authority.
Existing totals, including nulls, are untouched by migration; a null becomes 1
only on an accepted start. No historical totals are derived or reset.

Unexpected HTTP failures go to ordinary stderr/hosting logs with a random
X-Request-Id, fixed route/operation, error class and safe internal code. Billing
review/help outcomes and swallowed playback-read failures get fixed operation
context too. Messages, stacks, request bodies, cookies/proofs, headers, provider
payloads, personal data and private URLs are never serialized. Correlate a failed
HTTP request's X-Request-Id from browser network details when available. There is
no diagnostic database, per-error email, alert subscription or worker.
Browser-only network/media failures, CORS blocks before the app, support EmailJS
acceptance/inbox delivery, process crashes and provider problems that never reach
the server are not fully observable in application logs. Use the visible retry/
sign-in/billing/Help guidance and ordinary hosting logs; alerts and managed
exception monitoring remain deferred.

## Revised schema preflight

The new forward migration `20261107120000_bounded_simplification` locks and refuses
**any** TrackPlay or NetworkError row. There is no approved global destruction,
archive, export or retention rule for those records. If either table is nonempty,
stop for a precise owner disposition and separately reviewed implementation;
never empty the table to bypass the guard. Old successful b004 checks preserved
NetworkError and unrelated TrackPlay, so they do not establish this new condition.
The migration drops only empty stores and User.deletionNotice, replaces paid-period
cache columns with cachedStatus and invalidates derivative cache stamps. It keeps
pending deletion/revisions, selection/veto, tombstones, authority, attempts, catalog,
media references and aggregate totals. No historical migration was edited.

The database session must reverify source/schema/checksums, all original C1 guards,
new table counts/disposition, the exact seven-migration sequence and rollback,
prior required NetworkError column diagnostic versus the removed final schema,
aggregate/catalog/tribute/media preservation, pending state and all security/
selection/attempt tombstones. Coordinate writer shutdown and generated-client
rollout; old telemetry writers and old invoice-cache readers cannot run on the
new schema. PostgreSQL 15 compatibility and real provider/deployed behavior remain
unverified. Existing backup retrieval/rehearsal permissions are not renewed here.

## Local checks

Use compatible Node 24.19.0 and generated Prisma 4.12.0 client. See
[test/README.md](test/README.md) for synthetic/disposable PostgreSQL/browser commands.
The strict schema diagnostic must pass after guarded removal supersedes the old
NetworkError.errorCode required-DB/nullable-model mismatch. The new migration tests
explicitly assert the prior required column and nonempty refusal; do not suppress
the old diagnostic on any target that still retains the table. Local checks never prove real delivery, launch readiness or
the zero-routine-engineering / roughly five-hours-per-quarter target.
