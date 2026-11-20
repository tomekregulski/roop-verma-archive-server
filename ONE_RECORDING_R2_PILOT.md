# One-recording private R2 pilot — verified, 2026-11-16

**Owner approved the concrete plan; transfer and isolated player verification
completed.** One real existing subscriber recording remains in private R2
Standard storage. No shared database writes, hosted configuration/deployment,
schema/migration actions or Cloudinary changes occurred. The plan below retains
the preparation facts and approved procedure; this results section supersedes
its future-tense wording. Generated-sample expiry/completion evidence in
PRIVATE_AUDIO_PROVIDER_CHECK.md remains separate.

## Executed results and retained configuration

- Source conditional GET used the exact validated versioned reference and
  recorded ETag, no redirects or compression. Actual bytes **46,673,192**;
  native macOS afinfo identified MP3, duration **1166.8266 seconds (19:26.8)**.
  MD5 matched the source ETag. Full-file SHA-256:
  `7a6761437102fff1e0af57bedd487b4c3bb5fa0c5abdc4c544fd5b02d94a0776`.
- Maintained AWS S3 v3 PutObject returned 200 with IfNoneMatch `*`, STANDARD,
  audio/mpeg, Cache-Control `private, no-store`, Content-MD5 and no compression.
  The retained read credential then retrieved **all bytes**: length and computed
  SHA-256 matched the source. HEAD independently confirmed required metadata.
- SDK two-hour GET/range/CORS passed (206, 1,024 bytes at offset 100,000).
  Unsigned delivery denied (400). Bucket-only read credential PUT/DELETE against
  an absent probe and a GET capability used as PUT against that probe denied
  (403). No mutation probe targeted the recording.
- Existing AudioProvider/AudioPlayer and API client, native Chrome media, real R2
  object, synthetic local accounts/billing: primary **ID 7**, catalog number 15,
  raga/date and decoded duration matched. Anonymous denied 401; unsubscribed and
  unrelated account denied 403. Authorized issuance returned 200; Play progressed
  normally with readyState 4 and no native media error.
- Forward seek to 936 seconds exceeded the earlier buffered end 445.644;
  playback progressed to 941.3 with new 935.525–1057.175 buffering. Backward seek
  to 585 lay in a gap; playback progressed to 611.7 with new 584.089–711.977
  buffering. Pause stayed at 612.0 across observations; resume advanced to 636.3.
  Browser fetch separately confirmed 206 and `bytes 100000-101023/46673192`.
- A one-shot storage failure confined to the fixture produced an actual-route
  503. Existing **Retry playback** obtained fresh authorized R2 access, loaded at
  zero and played normally after Play. Native progression was later observed at
  920.0 seconds with no error; this is not a whole-recording completion claim.
  No media/API doubles or short-expiry application links were used. Media was
  muted in the diagnostic page; no independent auditory attribution claim.
- Synthetic cancellation denied fresh issuance 403; synthetic session revocation
  denied 401. Fixture listen count reached 2 only in memory. Final read-only
  application-DB inspection confirmed the **entire selected snapshot unchanged**,
  including public=false, plays=0 and the source-reference fingerprint. No
  application runtime connected to that DB, and no new shared catalog entry was
  created.
- Retained: bucket **rvdl-private-playback**, Standard, default jurisdiction,
  ENAM; public development URL disabled, no custom domain; exactly one verified
  MP3, no archival files. Account token **rvdl-private-playback-read**, Object
  Read only, exact bucket scope, retained without expiry. Cloudflare's read
  permission also allows listing; it supplies no write/delete/archive authority.
  CORS is the exact localhost GET/Range rule below. Provider's default abort of
  incomplete multipart uploads after seven days remains; it does not expire
  completed playback objects.
- Durable local operator files are in
  `/Users/tomekregulski/.config/rvdl/private-playback/`: `credentials.json`
  (read credentials only), `assets.json` (one validated ID-7 entry), and
  `delivery.json` (account/bucket/jurisdiction and manifest path). Directory 0700,
  files 0600, outside Git. The actual digest-key manifest stays private.
- Temporary transfer account token **rvdl-one-recording-transfer** was revoked
  immediately after integrity checks; refreshed dashboard inventory contains only
  the read token. A final SDK HEAD using the revoked credential denied **401**.
  Temporary credentials/downloads/raw source snapshot were removed; loopback
  services 3180/3181/3195 and the player tab were stopped. No media resource was
  deleted. Sanitized screenshots/JSON evidence remain at
  `/private/tmp/rvdl-one-recording.C90uY3/`; this report preserves durable findings.

Expected ongoing R2 cost remains **$0 within shared Standard allowances**, subject
to aggregate billing/rounding and future requests; no hard spending cap is
established. The earlier pricing/source-plan qualifications below still apply.
Hosted login-to-playback, mobile/Safari, impaired networks, full native completion
and two-hour wall-clock expiry were not verified in this pilot. Earlier generated
sample tests established separate short-link expiry/completion evidence.

Only explicit test fixtures changed: optional private pilot configuration and a
locator-free catalog snapshot, selection of the sole approved Track.id, a
test-only one-shot storage failure and sanitized diagnostics. Production player,
authorization, billing and request protections were unchanged. Existing 12
focused synthetic checks and the separate primary-ID regression pass; client
type-check, touched fixture lint and launcher syntax checks pass. The new
regression uses its own process, as required by the module-loader fixture.

## Verified selection and source revision

| Field | Selected existing catalog value |
| --- | --- |
| Track primary key / manifest trackId | **7** |
| Historical catalog Track.trackId (not the mapping key) | 15 |
| Raga | Chandrakaunsi Kanada |
| Primary artist, as currently recorded | Kevin West Milburn |
| Event / date / location | n/a / 01/27/1979 / Yoga Society of Florida |
| Visibility / listen total | public=false / plays=0 |
| Audio quality / notes | Both null; quality not independently established |
| Source | Exact existing HTTPS Cloudinary video/upload MP3 reference |
| Source version | v1650679366 |
| Reference fingerprint, SHA-256 of locator (not MP3 bytes) | aed1d981d6a56c5c446ce1c3993e7dd4fc999cf8c1f94c5186b7bcdea98a3a4f |
| HEAD metadata | 200; audio/mpeg; 46,673,192 bytes; no Content-Encoding |
| Source ETag / Last-Modified | dc322c788feb5ed325759788335d212e / 2024-03-02 19:18:15 UTC |

Preparation finding: this is a manageable existing subscriber recording with an available versioned
MP3 reference and no explicit poor-quality marker. Duration was absent from the
catalog and HEAD response; the approved download subsequently verified 19:26.8
without transcoding, as recorded above.
The catalog calls the media type `video`; the exact delivery reference ends in
.mp3 and HEAD says audio/mpeg. Preserve that catalog classification and artist
attribution; neither was corrected or independently authenticated here.

Heroku metadata identifies roop-verma-archive / app
fbcc7ce1-7840-40a7-b28b-8a1088c5ac48. DATABASE_URL is the application attachment,
postgresql-angular-93273, Essential-1, PostgreSQL 15.18. BROWN is the distinct
postgresql-opaque-25781 Essential-0 shadow attachment and was not queried. The
inspection compared connection targets in memory, verified current_database()
against the application URL, and verified transaction_read_only=on. Queries used
READ ONLY / REPEATABLE READ, 5-second statements, 1-second locks, bounded LIMIT 3
selection and ROLLBACK. Only catalog relations were read; no account/customer
rows, exports or schema/migration operations. A narrower artist-name search
returned no matching candidate; no attribution was inferred from that absence.

Source validation required exact res.cloudinary.com HTTPS authority, a bounded
video/upload MP3 path, no credentials, port, query, fragment or traversal, and no
redirects. Only one exact candidate received HEAD; no response body was fetched.
The locator and selected row are held only in an owner-only local preparation
directory; ordinary evidence omits the locator.

Reviewed source: server c5e791d (PR #70; implementation 7ecda23), client 2b80f58
(PR #109; implementation 8938b03). Both checkouts were clean on arrival. Server
is on main; client is on private-audio-sample-player at the merged revision.
No branches switched. Older unstaged-state descriptions below other handoffs
are historical; optional renewal work remains excluded.

## Approved resource plan and cost basis

The previously approved Cloudflare account has R2 activated. Its signed-in
overview showed **no buckets**, zero displayed usage and $0.00 billable usage;
its R2 token list showed no Account or User API tokens. No earlier test bucket
or credential is reusable.

Create **rvdl-private-playback**, Standard, default jurisdiction, Eastern North
America placement hint. Keep both r2.dev public access and custom domains
disabled; no Worker/CDN, lifecycle deletion or archival contents. Stop if this
name unexpectedly exists rather than repurposing it.

- Create a temporary **Object Read & Write** transfer credential scoped only to
  that bucket, with a 24-hour expiry and prompt revocation after integrity checks.
  Bucket creation/CORS use the existing signed-in dashboard; no account-wide
  administrator API token is needed.
- Create a separate retained **Object Read only** playback credential scoped only
  to that bucket, named rvdl-private-playback-read. It can also list objects under
  Cloudflare's permission model; the application does not list. No archive access.
- Proposed private local configuration: owner-only directory
  `~/.config/rvdl/private-playback` (0700), credential/configuration and manifest
  files (0600), outside Git and cloud-synced folders. Never put credentials in
  frontend variables, commands, screenshots or ordinary evidence. Retain only the
  read credential; remove temporary transfer credentials and download files.
- Proposed CORS: only `http://127.0.0.1:3180`; methods GET; allowed header Range;
  expose Accept-Ranges, Content-Range, Content-Length, ETag; max age 300 seconds.
  Server HEAD needs no browser CORS. Add hosted origins only in the separately
  authorized activation workstream; no wildcard origin.

Expected pilot storage and bounded verification cost is **$0 within the shared
Standard allowances** (10 GB-month, 1M Class A, 10M Class B monthly; direct egress
free). Without unused allowance, this file's unrounded storage contribution is
about $0.00070/month; actual billing rounds aggregate usage up, including storage
GB-month and million-request units. Excess rates are $0.015/GB-month,
$4.50/million Class A and $0.36/million Class B. Dashboard usage is not a final
invoice or hard spending cap. Cloudinary retrieval may consume the existing
account's delivery allowance; its plan-specific charge is unverified. Limit this
to the exact 46.7 MB retrieval with no transformations or asset discovery.

References checked during preparation:
[R2 pricing](https://developers.cloudflare.com/r2/pricing/),
[bucket-scoped permissions](https://developers.cloudflare.com/r2/api/tokens/),
[atomic create-only writes](https://developers.cloudflare.com/r2/api/s3/conditional-operations/),
[S3 metadata/checksum compatibility](https://developers.cloudflare.com/r2/api/s3/api/).

## Small transfer/mapping procedure (executed once for this pilot)

1. Recheck just Track.id 7 in a bounded read-only transaction, comparing its
   source-reference fingerprint and catalog snapshot. Abort on drift. Recheck
   source HEAD; use the recorded ETag as If-Match on GET to avoid silently copying
   a changed source. Fetch only the validated exact location with redirects
   disabled, Accept-Encoding: identity, bounded time/size and private local output.
2. Probe the actual MP3 and duration. Require nonempty expected audio, exact
   46,673,192-byte length and source revision consistency. Compute SHA-256 of
   the complete unchanged file; keep that distinction from the locator fingerprint.
3. Use the already installed maintained AWS S3 v3 SDK, explicit R2 endpoint and
   temporary upload credential. PutObject with key `playback/<MP3-sha256>.mp3`,
   IfNoneMatch `*`, StorageClass STANDARD, ContentType audio/mpeg,
   CacheControl `private, no-store`, ContentMD5 of the source and no compression.
   Never replace a digest key. On 412 or ambiguous completion, inspect and hash
   the exact object; do not fall back to an unconditional PUT.
4. HEAD for size/MIME/cache/compression, then stream the entire R2 object back
   through SHA-256 using the playback read credential. Require digest and length
   equality with the source; object name, ETag or custom hash metadata alone
   does not establish integrity. Destroy SDK clients and revoke upload authority.
5. Save the private one-entry operator manifest using the existing validator:
   `[{"trackId":7,"key":"playback/<actual-MP3-sha256>.mp3"}]`.
   The placeholder is intentionally invalid. Validate with playback/assets.js;
   no schema change, catalog duplicate or Track.url fallback. Retain the actual
   manifest with private operator configuration, not committed evidence.
6. Configure only the isolated existing provider fixtures with the selected
   Track.id and sanitized catalog snapshot, real R2 delivery and synthetic
   identity/billing. Any necessary fixture adaptation stays under test tooling;
   production authorization, player and request protections remain unchanged.

## Bounded player verification and cleanup

Use the existing AudioProvider/AudioPlayer/API client and native media, loopback
ports 3180/3181, synthetic fixture identity and fake Stripe/email only. Do not
connect the running fixture to the shared database. Verify the real selected ID
and metadata, normal start/progression, forward/backward seek outside current
buffer where possible, pause/resume and explicit Retry (fresh authorization,
fresh Audio element, restart at zero). Use short natural playback observations;
do not repeat the prior full 15-minute sample or two-hour wall-clock test.

Check anonymous=401 and unsubscribed/foreign-account=403 for this subscriber
track. Verify unsigned delivery denial and playback-credential PUT/DELETE denial
against an absent probe key, never the retained recording. Verify a GET capability
cannot PUT. If any permission unexpectedly permits a probe write, stop and report
the specific result before cleanup or widening scope. Fresh cancellation/session
revocation checks may reuse the existing fixtures; their prior provider evidence
and this pilot's actual checks must be reported separately.

Afterwards re-read only Track.id 7 (READ ONLY) and compare the catalog snapshot,
including plays and source reference. No DB writes or new catalog entries are
part of the procedure; fixture listen increments are synthetic. Stop only this
pilot's listeners, remove temporary downloads/source locators/transfer credential
files, and revoke the temporary upload token. Retain the successful object,
private bucket, read credential and operator manifest. Record actual byte hash,
duration, checks and resources here without exposing the object locator/credentials.

Local preparation evidence: 12 focused existing synthetic checks passed on Node
24.19.0 (playback-delivery, playback-runtime, provider-playback-fixture). Initial
sandbox loopback denial was resolved by rerunning with approved loopback access.
These tests do not prove real-recording playback. No application code changed.

To repeat the isolated player check after separately approving any further media
access, use Node 24.19.0 and the existing launcher:

```sh
node test/r2-provider-harness.mjs /absolute/private/credentials.json /absolute/private/pilot.json
```

The private pilot JSON contains exactly the intended `accountId`, `bucket`,
absolute `manifestFile` and absolute `catalogTrackFile`. The latter is a
locator-free metadata snapshot of the one existing subscriber track; unrelated
nested relation IDs unused by playback may be synthetic locally, while Track.id,
Track.trackId, raga/date/location/artist text and subscriber visibility retain
the selected catalog values. The launcher validates a single matching manifest
entry. Its default two-argument generated-sample mode is unchanged; those deleted
test resources are not reusable. This fixture is never imported by app startup.

## Exact hosted integration contract — instructions only

Activation remains a separate workstream waiting on login-email DNS. Do not run
these steps here or alter the rehearsed seven-migration sequence.

1. Receive the reviewed private manifest and its SHA-256 through private operator
   configuration. Keep its durable source in access-controlled release secrets
   as `PLAYBACK_ASSETS_JSON`, with an owner-held private copy; this is a proposed
   operator startup input, not an environment variable currently read by the app.
2. Have the hosted workstream add a small startup materialization step before
   `node index.js`: create `/app/.playback` with mode 0700; parse that JSON, write
   an adjacent mode-0600 candidate, validate using `readAssets` from
   `playback/assets.js`, then atomically rename to `/app/.playback/assets.json`.
   Fail startup on invalid/missing input. Source JSON stays durable in private
   hosted configuration and regenerates on every dyno start; `/private/tmp` and
   one-off `heroku run` files are not the deployment configuration.
   A concrete future Procfile web command is below; it is an **unexecuted hosted
   integration instruction**, not an existing deployment file:

   ```procfile
   web: umask 077; mkdir -p /app/.playback && chmod 700 /app/.playback && node -e 'try{const fs=require("node:fs");const p="/app/.playback/assets.json";const raw=process.env.PLAYBACK_ASSETS_JSON;JSON.parse(raw);fs.writeFileSync(p+".candidate",raw,{mode:0o600});fs.chmodSync(p+".candidate",0o600);require("./playback/assets").readAssets(p+".candidate");fs.renameSync(p+".candidate",p)}catch{process.stderr.write("Playback manifest configuration invalid\n");process.exit(1)}' && exec node index.js
   ```

   Keep both JSON/config and read credentials private, and do not paste their
   values into a shell command/history. The existing app continues to read only
   PLAYBACK_ASSETS_FILE; no new mapping endpoint or schema is required. Validate
   The materialization body passed isolated valid/invalid-input checks with
   synthetic JSON in a disposable local directory (including mode 0600 and
   sanitized failure output). Hosted startup itself remains unverified; validate
   the wrapper under the hosted workstream's normal release checks before use.
3. Under separate activation approval set PLAYBACK_ASSETS_FILE to
   `/app/.playback/assets.json`; PLAYBACK_R2_ACCOUNT_ID to the reviewed account;
   PLAYBACK_R2_BUCKET to rvdl-private-playback; PLAYBACK_R2_JURISDICTION=default;
   PLAYBACK_R2_ACCESS_KEY_ID / SECRET_ACCESS_KEY to the bucket-only read credential.
   Never supply the upload credential or add media secrets to Netlify.
4. Add only approved exact hosted frontend origin(s) to bucket GET/Range CORS,
   retaining the local origin only while needed. Review private access and token
   scope, deploy through the existing activation procedure, and perform hosted
   cookie/CSRF/login/status/playback verification there. A one-entry manifest
   means other catalog recordings remain unmapped and return unavailable delivery.
5. Review manifest changes atomically and restart separately; they do not revoke
   existing two-hour capabilities. Before public activation, complete the bounded
   issuance-limit/budget-alert follow-up already recorded in Operations.md.

To remove this pilot later: separately approve removal, remove the manifest
entry and restart the hosted/local reader as applicable; revoke its read token
and delete only the exact retained object after confirming no other mapping uses
it. Delete the bucket only if empty and no longer used; remove private config and
local CORS. Already delivered bytes cannot be recalled. Keep Cloudinary, the
database reference, archival originals and backups untouched.

Remaining work includes hosted activation, public-URL retirement, later separately scoped library copies,
and archival/backup verification. This pilot does not migrate the library,
authenticate catalog attribution, establish archival preservation, verify hosted
login-to-playback or make the archive launch-ready.
