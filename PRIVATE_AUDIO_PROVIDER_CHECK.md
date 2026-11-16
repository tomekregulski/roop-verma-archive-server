# One private sample — provider verification, 2026-11-14

**Approved verification and cleanup completed on 2026-11-14.** The
owner activated R2. The approved Standard test bucket was created in Eastern North
America with public access disabled. The generated 7,200,600-byte MP3 was uploaded
through the signed-in dashboard into the playback prefix, avoiding a write token;
the dashboard also created a zero-byte folder marker. MIME is audio/mpeg. The
localhost-only CORS policy below was used. The owner approved and we created the
Object Read only token `rvdl-private-sample-read-test`, scoped solely to this
bucket and expiring in 24 hours. Credentials were held in a mode-0600 local file
outside both repositories. The sample, folder marker and bucket are now deleted;
the token is revoked and its local credential file removed. Both listeners stopped.

Direct SDK checks pass: metadata, two-hour GET, nonzero range/CORS (206), unsigned
denial (400, no audio), altered object/signature/expiry and PUT denial (403),
read-credential write/delete denial (403), and a separate five-second GET that
works before expiry and returns 403 after 6.5 seconds. No URLs/secrets were logged.
The existing player passed public playback, protected active/past_due access,
anonymous/unsubscribed/foreign-account denial, explicit Retry, forward/backward
seeking outside buffered ranges and ordinary pause/resume. The uninterrupted
15-minute native check completed: native time reached 900.075 seconds, `ended`
was true and media error was null. Cancellation denied fresh issuance (403);
revoked sessions returned to anonymous/login-required behavior (401).
No existing database, real Stripe/email, actual recording or deployment was used.
Email DNS is independent. Setup evidence is local at
`/private/tmp/rvdl-r2-evidence/private-bucket-cors.jpg`.

## Actual player evidence and limits

- Real private R2 audio, existing AudioProvider/AudioPlayer and API client; no
  media/URL double or rewrite. Browser: Codex in-app browser (its precise engine
  version was not exposed by the captured UI). Generated tone muted in test code;
  native playback/decoding/position/error state remained real.
- Forward seek from about 3 seconds to 762 seconds exceeded the buffered end
  (405.974); playback advanced to 770.2 with a new 757.76–900.075 range. Backward
  seek to 523 lay between the old buffer ranges; playback advanced to 531.8 with
  a new range beginning at 520.191. No media error. Browser GET Range separately
  returned 206 and exactly 1,024 bytes with Content-Range
  `bytes 100000-101023/7200600` visible through CORS.
- Ordinary pause settled at 536.5 seconds; resume advanced from that position.
  Account changes/logout cleared old media. Uninterrupted fresh protected playback
  then advanced naturally from zero through 900.075 seconds at normal speed,
  with periodic native-state evidence and no error or recovery action.
- Existing explicit Retry succeeded after the synthetic server's access condition
  changed, and denied after cancellation/revocation. The two-hour signing contract
  passed SDK/unit checks. **No full two-hour wall-clock app expiry run occurred.**
  The separate five-second real R2 probe proves provider expiry, while existing
  local timer/Audio-double evidence covers app stop/Retry behavior. Buffered bytes
  can remain usable after a capability expires.
- One existing UI issue was observed at natural completion in a one-item list:
  native `paused=true, ended=true`, but context `isPlaying=true` leaves “Pause”
  visible and the progress text at 14:59. Delivery completed successfully. With
  owner approval this was fixed on 2026-11-15: native `ended` synchronizes stopped
  state, clears the progress timer and displays the final position. Selection is
  retained without automatic continuation/renewal; manual Next/Previous remain.
  All 29 React browser assertions pass, including the focused Audio-double
  regression for label/position and no new selection/issuance/listen after the
  former timer tick. Client 14 unit checks, types, touched-file lint and build
  pass. This follow-up made no provider calls and did not repeat the R2 test.
  Local evidence: `ended-state-regression.txt` / `ended-state-regression.jpg`.
- No mobile/Safari, impaired-network or 45-minute recording claim is made. This
  verifies one sample with synthetic local identity/billing, not hosted production,
  real Stripe/email, the existing catalog or archival preservation.

Sanitized local evidence is under `/private/tmp/rvdl-r2-evidence/`:
`continuous-listen.ndjson`, `protected-native-playing.jpg`,
`protected-native-completed.jpg`, `public-native-player.jpg`,
`authorization-final.jpg`, plus setup/cleanup screenshots. Evidence contains no
signed URL, secret, cookie or real customer/recording. Screenshots are local
artifacts; this report retains the durable findings if temporary artifacts expire.

## Goal and scope

Use our existing AudioPlayer and authorized playback-access endpoint to fetch/play
one protected MP3. Keep **two-hour app links and explicit Retry**. Recordings are
mostly **15–45 minutes**. Do not include automatic renewal, seamless position
preservation, background recovery, DRM, download prevention, analytics or custom
streaming infrastructure. Expected manual Retry restarting at zero is not itself
a reason to add recovery. Any material ordinary-listening defect gets evidence and
a small maintenance-cost proposal before implementation expands.

The lean client is the normal `/Users/tomekregulski/Desktop/rvdl/roop-verma-archive-client`
checkout on `main`, with only the bounded ended-state fix above changing
application source from `bf272a0`, and this
slice's handoff/sample tooling unstaged. Expanded renewal work remains preserved
separately and is excluded from this test. The normal sibling server checkout on
`main` has the R2 SDK adapter changes unstaged; identity/billing policy is unchanged.

## Cost-abuse follow-up — noted, excluded from this test

Owner directed on 2026-11-14 to record the risk and proceed with the approved
private test. Before public activation, review a modest playback-access issuance
rate limit using the existing limiter and a low budget alert. The current issuance
route has no dedicated limit; each successful mapping performs a billable HEAD.
A valid presigned GET can also be reused until expiry, independently of issuance
limits. Cloudflare documents authentication/authorization-rejected requests as
uncharged; successful reads can accrue fees. R2 has no supported native hard
spending limit in the reviewed docs. Rate limits/alerts reduce risk but do not
guarantee an invoice cap. No rate-limit implementation, automatic cutoff or extra
streaming infrastructure is authorized as part of the current test.

References: [R2 pricing](https://developers.cloudflare.com/r2/pricing/),
[presigned links](https://developers.cloudflare.com/r2/api/s3/presigned-urls/),
[spending-limit scope](https://developers.cloudflare.com/billing/manage/spend-management/).

## Approved resources

- Owner-designated Cloudflare account: identify/authorize it without posting
  credentials here. The owner completes any R2 activation/financial agreement.
  Do not inspect unrelated resources.
- New bucket `rvdl-private-playback-verification`, **Standard**, default
  jurisdiction, Eastern North America hint `enam` (a preference, not guaranteed
  residency). If the name already exists, stop and agree a new one. Public
  r2.dev/custom-domain access disabled; no Worker or CDN.
- One generated **15-minute**, mono 22.05 kHz / 64 kbps MP3, **7,200,600 bytes**,
  prepared at `/private/tmp/rvdl-private-audio-15-minute-sample.mp3` using the lean
  client's `test/synthetic-mp3.mjs` and optional external lamejs 1.2.1. SHA-256:
  `7b2da22784d895ec73f21ea2be285ffbf84536288d71c1d114cb18e515e3368e`.
  Object key: `playback/<that full digest>.mp3`. Recheck bytes/hash before upload.
- Playback credential: **Object Read only**, scoped solely to this bucket, held
  by the local server. Permission also permits listing, which the app does not
  use. No archive permission. Upload/cleanup use the already-authorized signed-in dashboard; no write
  credential is created or supplied to the application.
- CORS for the isolated browser origin only:

```json
[
  {
    "AllowedOrigins": ["http://127.0.0.1:3180"],
    "AllowedMethods": ["GET"],
    "AllowedHeaders": ["Range"],
    "ExposeHeaders": ["Accept-Ranges", "Content-Range", "Content-Length", "ETag"],
    "MaxAgeSeconds": 300
  }
]
```

Server HEAD needs no browser CORS. CORS is not authorization. Production origins
and configuration remain a separate activation action.

## Isolated setup and reproduction

1. The digest/bytes were checked and the sample was uploaded once through the
   signed-in dashboard into the new empty bucket. No uploader credential was
   created. Actual HEAD confirms audio/mpeg, expected length and no compression.
   Dashboard upload did not establish conditional-PUT or Cache-Control behavior;
   do not claim those were tested. Future operator uploads should use SDK
   `If-None-Match: *`, `ContentType: audio/mpeg`, no Content-Encoding and
   `CacheControl: private, no-store`. Never overwrite a digest key.
2. Create one operator-owned local manifest row: exact Track primary ID **10**
   and the digest key above. Use fresh synthetic catalog state; switch only this
   fixture's public flag between public/protected cases. No existing DB/catalog
   is read or changed. Supply explicit PLAYBACK_R2_* configuration and absolute
   PLAYBACK_ASSETS_FILE using the read-only credential.
3. Bind the existing isolated backend fixture to the real R2 adapter, actual
   identity service/status reader and authorized endpoint. Synthetic users/mail/
   Stripe and, if needed, fresh disposable PostgreSQL provide the trusted session
   and intended-subscription association. Do not add a production fake signer or
   grant switch. The explicit local binding is now `test/support/provider-playback.js`, launched
   by the client `test/r2-provider-harness.mjs` with a private credentials file.
   It never loads normal production environment values. Its two focused local
   authorization/isolation checks pass. The 271-check synthetic server suite also
   passes on Node 24.19.0; prior fresh disposable PostgreSQL evidence remains
   142/142. No schema changed, so that unrelated suite was not repeated.
4. Serve the **unchanged existing AudioPlayer** at `http://127.0.0.1:3180`, using
   actual API requests and the actual R2 media URL. No Audio double, local URL
   rewrite or optional renewal helper in this acceptance path. No real email,
   Stripe or deployed application is required.

Explicit commands, using compatible Node 24 (not ordinary app startup):

```sh
# Server root; only the fixed approved synthetic R2 object is probed.
node test/r2-provider-check.js /absolute/private/credentials.json
# Client root; synthetic identity/billing, existing player, real R2 audio.
node test/r2-provider-harness.mjs /absolute/private/credentials.json
```

Credentials JSON has exactly `accessKeyId` and `secretAccessKey` and must have
private file permissions. The fixture serves only 127.0.0.1:3180/3181 and reads
no normal environment file. Open `/test/r2-provider.html` on port 3180. Fixed
controls establish local actors/public flags/status/cancellation/revocation;
native diagnostics show position, buffer ranges and error code, never media URLs.
Stop with SIGINT/SIGTERM; the launcher closes listeners and removes its manifest/
cache. The provider script is explicit opt-in and is not part of `npm test`.

## Minimum acceptance evidence

Record sanitized assertions, status codes, durations and range counts/browser
version. Do not record signed URLs, credentials, cookies, private locators or HAR.

1. Anonymous public plays. Protected anonymous/unsubscribed/foreign accounts deny;
   trusted active/past_due allow. Client-supplied key/bucket/entitlement substitution
   rejects. Logout/revocation/cancellation during issuance must not bypass the
   existing final authorization check.
2. Play the representative sample normally. Check duration/decoding, forward and
   backward seeks outside buffered audio, actual nonzero Range → HTTP 206 with
   correct Content-Range, ordinary pause/resume and no overlapping audio. Include
   a continuous **15-minute listen** rather than only short playback bursts.
3. Confirm app URLs request a **two-hour GET** for the intended object. Unsigned,
   altered-object, altered-signature/expiry and PUT requests with the GET URL deny.
   Review the token's exact bucket scope rather than requesting archival objects.
   Read credentials must reject write/delete of an absent synthetic key in this
   new bucket. Missing mapping/object/provider failure must fail closed.
4. For fast provider-expiry proof, use a **separate five-second SDK-only GET URL**:
   fresh GET succeeds; fresh uncached GET/Range after expiry denies. Keep this
   distinct from the two-hour app contract. Buffered bytes/existing connections
   may survive expiry and are not a new authorization. If a full two-hour app
   wall-clock check is run, record it separately: expiry stops the player, then
   explicit **Retry playback** gets a new authorized link with existing behavior.
   Local timer/Audio-double checks alone cannot establish provider expiration.
5. Report observed failures before changing player behavior. For a problem during
   ordinary 15–45 minute listening, document trigger, expected/actual behavior,
   reproducibility and listener impact; propose the smallest fix and cost. A long
   pause exceeding two hours can use existing Retry; do not automatically add a
   recovery lifecycle.

## Cleanup, cost and approval

Approved cleanup completed: the dashboard confirmed deletion of the generated
MP3, folder marker and empty test bucket. After token deletion, a fresh SDK HEAD
returned 401; the refreshed token list contains no user/account R2 tokens. The
private credentials file/directory were removed, the fixture shut down and its
manifest/cache removed; ports 3180/3181 have no listeners. Generated local audio,
sanitized evidence and preserved implementation work remain. R2 account
activation remains enabled; no test bucket/token remains. Setup/cleanup screenshots
include `test-bucket-removed.jpg` and `test-token-revoked.jpg`.

One 7.2 MB object and fewer than 1,000 read/write requests should fit available
Standard allowances. The dashboard showed $0.00 billable usage during verification;
its counters can lag and the final invoice was not checked. Standard includes 10 GB-month /
1M Class A / 10M Class B monthly. Excess storage is $0.015/GB-month, writes
$4.50/million and reads $0.36/million, with billing-unit rounding; direct egress
is free. No extra recurring service/domain is proposed.

The owner approved **account + this generated sample + bucket/token/CORS + one
upload + scoped allowed/denied/browser/expiry tests + cleanup**; token creation
also received explicit browser action-time approval. Estimated effort was
1–3 active hours after access/approval, plus optional two-hour elapsed testing;
owner/provider wait and newly demonstrated defects are separate. Hosted activation
still needs its existing DNS/HTTPS/cookie/config/preflight/rollout approvals.
Bulk transfer, actual recordings, archival preservation and public-URL retirement
remain outside this slice.

Official references reviewed 2026-11-14:
[presigning](https://developers.cloudflare.com/r2/api/s3/presigned-urls/),
[maintained S3 SDK](https://developers.cloudflare.com/r2/examples/aws/aws-sdk-js-v3/),
[token scope](https://developers.cloudflare.com/r2/api/tokens/),
[CORS/expired responses](https://developers.cloudflare.com/r2/buckets/cors/),
[location](https://developers.cloudflare.com/r2/reference/data-location/),
[conditional PUT/ranges](https://developers.cloudflare.com/r2/api/s3/api/),
[pricing](https://developers.cloudflare.com/r2/pricing/).
