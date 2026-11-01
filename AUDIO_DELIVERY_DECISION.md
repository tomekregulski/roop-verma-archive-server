# Audio storage and subscriber delivery — decision brief

**Local implementation update — 2026-10-28:** the owner subsequently authorized
local playback policy/issuance and frontend work. That bounded work is now
implemented and tested; see [PLAYBACK_API.md](PLAYBACK_API.md) and the current
[handoff](BACKEND_BASELINE.md). This supersedes the earlier “no application code
changed”/future-local-task wording only for this subsequent local session.
Production entitlement, mapping/signing and provider delivery remain incomplete.
Final provider approval and all remote/migration/restoration limits below remain.
The dated assessment and sizing rationale below are retained as planning history.


Assessment date: 2026-10-28. **Owner prefers R2 subject to sizing/final review and
accepts a two-hour URL lifetime for planning. No purchase, migration or
implementation is approved. The core listening policy below is owner-approved;
remaining policy choices are unresolved.** Restoration
remains deferred. No application code, provider settings, media, infrastructure
or database changed. No private provider metadata or protected media was accessed.

Read: AGENTS.md, current BACKEND_BASELINE.md, BACKEND_READINESS_PLAN.md and sibling
client DEVELOPMENT_NOTES.md / IDENTITY_HANDOFF.md. Source snapshot: server
4a6327a0e432903b491690b2d44f5144f7309204; client
eae9d13e3924083fa647ec1dbcfdce211e837b3a. Local identity and catalog-mutation
verification is prior evidence; it does not establish media entitlement, billing
consistency or deployed readiness.

## Recommendation and decisions to resolve

Owner's planning preference is **private Cloudflare R2
Standard playback objects with server-issued, object-specific presigned GETs**.
Keeping Cloudinary remains reasonable if an existing affordable arrangement for
expiring, enforced private delivery is confirmed; current terms are unknown.
Start without a custom CDN/Worker: at this scale avoiding egress charges matters
more than edge caching. Add a Worker only if measured latency or a requirement
for custom-domain cached delivery justifies its maintenance. This compares the
existing provider with one alternative, intentionally limiting scope.

The concrete reason to consider changing is price: Cloudinary's documented CDN
token feature requires Advanced or higher, listed at $249/month paid monthly;
R2's current owner-sized playback storage is approximately $0–$0.03/month with
the available Standard allowance. Ordinary Cloudinary
delivery signatures have no per-listen expiry. Existing account terms are unknown.
See [Cloudinary access controls](https://cloudinary.com/documentation/control_access_to_media)
and [prices](https://cloudinary.com/pricing).

Owner sizing and planning choices received after the initial draft:

- **117 MP3 files, each 30–100 MB**, not 30–100 MB for the whole library.
  Aggregate bounds are 3,510–11,700 MB, approximately **3.51–11.70 decimal GB**.
  These are bounds, not a measured total. If MB meant MiB, the upper bound is
  approximately 12.27 decimal GB; the budget conclusion is unchanged.
- **30–100 listeners**, meaning total audience or concurrency not specified;
  monthly listening hours remain unknown. Budget is tight, without a new dollar cap.
- **Projected growth: 100–150 additional files/year for five years**, supplied
  by the owner. Future file sizes are assumed to remain 30–100 MB each for the
  estimates below; this size assumption is not a separately confirmed forecast.
- **Plan one higher-quality WAV per MP3**, for preservation rather than routine
  streaming. Owner's sizing assumption: MP3 bytes are 15% of WAV bytes, so
  WAV = MP3 / 0.15 (about 6.67 times larger). WAV existence/provenance is not
  verified; this reserves space and does not claim the files are already held.
- Prefer R2 subject to sizing and final review; two-hour temporary links are
  acceptable for planning. This does not authorize provider access or implementation.

### Approved listening policy — 2026-10-28

The owner approved the following policy in chat:

- Public tracks are playable by everyone.
- Subscriber tracks require a verified login and a current paid subscription.
- Cancellation preserves access until the paid period ends.
- Incomplete or unpaid subscriptions do not grant access.

This approves the business rule, not implementation, migration, provider access
or restoration. The existing subscription field is not thereby made reliable;
live paid access must wait for trustworthy billing synchronization. Trials,
past-due grace, refunds/disputes and special grants are not approved by this policy.

Owner choices still needed:

- Exact aggregate bytes, bitrate/duration, listening hours, peak concurrency
  and dollar budget remain unknown. Repo guidance
  gives 2–4 engineer hours/week, development $10–15/month, launch under $30/month,
  and 100 registered users as exceptional success; registered users are not
  concurrent listeners. Current handoff says no real subscribers (owner report).
- Final R2 approval after sizing/review. No account inspection is authorized.
- Which tracks are deliberately public? May everyone see subscriber-track
  metadata, or should that metadata also require entitlement?
- Exceptions to the approved paid policy: trials, past-due grace, refunds,
  disputes, paused accounts, gifts/test grants and whether admins need separate
  playback rights. Do not infer permission from those unresolved cases.
- Two-hour life is accepted for planning, with renewal on continued use; it is
  not a promise of instantaneous revocation.
- Where are archival originals and independent backups today, who owns them,
  and what recovery time/loss is acceptable? Playback MP3s do not prove originals
  have been preserved.

## Current delivery: confirmed from source

Paths are relative to `/api/v1`; `:key` is the public compatibility API key.

| Step | Source and confirmed behavior |
| --- | --- |
| Catalog | `routes/v1/track/index.js`: GET `/track/:key` uses only isValidApiKey; JWT middleware is commented out. GET `/track/public/:key` also uses only the key. `controllers/track/controller.get.js` returns whole Track records with relations; only publicTracks applies `public: true`. No media entitlement check. |
| Storage model | `prisma/schema.prisma`, Track: required `url: String`, `public: Boolean`, `master: Boolean`. No separate Cloudinary asset/public ID, delivery type, version, byte size, codec, duration, checksum or archival locator. `master` is catalog metadata, not verified preservation provenance. |
| Identifiers | Historical `prisma/seeds/trackSeeds.js` embeds complete Cloudinary video/upload MP3 URLs, with versions and public IDs inside paths. These are historical source references, not a live inventory; identifiers/URLs are deliberately omitted here. No upload/signing service found in mounted application paths. Admin-protected create/update accepts the URL via forwarded Prisma input. |
| UI catalog choices | Client `src/context/AudioContext.tsx` fetches all tracks when isAuth && hasAllowedStatus, otherwise public tracks; effect depends only on isAuth. `src/context/AuthContext.tsx` permits trialing, active **and incomplete** for display. This is not server authorization. |
| Duplicate read/cache | `src/views/AudioView.tsx` also runs `src/queries/audioQueries.ts`: both authenticated and anonymous branches request the full catalog. Query key is always `['tracks']`, stale/cache times Infinity. That result is not the context's trackList, but still exposes the response to the browser/cache; authenticated branch logs it. Context also logs selectedTrack. |
| Selection | TrackContainer selects from context filteredTracks; AudioPlayer assigns `selectedTrack.url` to trackSrc, constructs `new Audio(trackSrc)` and calls load/play. The browser requests the provider directly. |
| Actual audio boundary | `src/api/client.ts` adds backend cookies/CSRF to Axios calls. `new Audio(...)` does not use that client, its interceptor or its headers. No application media gateway, per-track access issuance or temporary URL renewal was found. |

`public: false` currently means omission from the filtered catalog, not protected
bytes. API-key-only full-catalog reads and disclosed media locators are confirmed
gaps. Previously verified admin mutation guards protect editing, not listening.
Playback telemetry POST `/track/track-play/:key` is not an access boundary.

### Seeking, track changes and long recordings

The slider sets audio.currentTime. A one-second interval reads progress and
checks ended; load, buffering and HTTP Range handling are delegated to the
browser. Native range delivery permits seeking without downloading everything
([browser delivery guide](https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Audio_and_video_delivery/buffering_seeking_time_ranges)).
No request/206/header capture or real long-recording test was performed.

Source issues relevant to the next playback task:

- duration is read during context render; there is no loadedmetadata/durationchange
  listener establishing reliable seek limits before playback.
- Selection sets currentTrackIndex to id minus one, overwriting the actual
  filtered-array index. Previous/next rejects index zero via a truthiness check;
  filtered/noncontiguous IDs can navigate incorrectly.
- Changing track pauses the old element, creates a new element and sets playing
  false. There is no reliable automatic continuation after ended/next selection.
- No handled play() rejection, media error/stalled recovery, access-expiry timer,
  current-time restoration after URL renewal, or race guard for late track access
  responses. Logout/status changes do not explicitly clear the selected media.
- Listening counter follows progress changes rather than elapsed audible time;
  it is not evidence of delivered bandwidth or accurate listening hours.

These are static findings, not reproduced browser failures in this session.
Actual asset format/bitrate/duration, current URLs, provider delivery types,
token availability, caches, CORS, Range/206 behavior, usage and backups are unknown.
Cloudinary documents upload assets as public by default, but source URL shape
alone does not prove the current account's access rules. Seek/range verification
must use synthetic media locally first; ask before protected-media/provider tests.

## Provider comparison

| Concern | Keep Cloudinary | R2 Standard; optional Worker/CDN |
| --- | --- | --- |
| Storage/delivery cost | Shared credits cover storage, bandwidth and transformations; requests/CDN included in platform pricing. Free 25 credits; Plus $99/225; Advanced $249/600 monthly. Existing contract unknown. | $0.015/GB-month, free egress. Monthly Standard allowance 10 GB, 1m Class A and 10m Class B operations. Above allowances: $4.50/m A, $0.36/m B, rounded to billing units. |
| Private temporary access | For CDN expiry use provisioned access-control tokens; not just signed delivery URLs. `private` leaves derived assets public by default; authenticated delivery protects originals and derivatives. | Private bucket; backend signs GET for one mapped playback object after authorization. No public bucket domain. R2 presigned URLs work on S3 API domain, not a cached custom domain. |
| Cheaper Cloudinary mechanism | private_download_url expires but bypasses CDN; docs discourage website embedding and warn of double bandwidth. Not the recommended streaming architecture; range/long-audio suitability unverified. | Optional Worker verifies an app-issued short-lived token before **every** response/cache lookup, reads private bucket binding and streams ranges. Extra code/key rotation/caching responsibility. |
| Playback/caching | Browser progressive MP3 is the current model. CDN token expiry/renewal and range requests require synthetic validation. | Native GET Range supported. Direct presigned delivery avoids CDN complexity; latency unmeasured. Worker caching must authorize cache hits, use immutable version keys and never cache denial or bypass auth with a public route. |
| Transformation | Built-in processing consumes credits; derivatives add storage. Audio accounting needs actual workflow verification. | No included audio transcoding pipeline. Prepare one playback rendition locally/offline; preserve originals. No new transcoding service recommended. |
| Maintenance/portability | Least file movement and existing integration; Cloudinary-specific locator/type/signature rules remain. | Small signing adapter initially; S3-compatible export is portable. Worker adds deployment surface if adopted. Provider-independent track-to-asset mapping limits future changes. |
| Backup | Automatic backup availability does not establish it is enabled. Cloudinary-hosted backup versions add storage credits; own-cloud backups require paid plans. | Storage durability is not backup. Immutable original keys, separate backup credentials/copy and restore checks needed. S3 bucket versioning/replication APIs are not supported; R2-native bucket locks are a separate option. |

Rates/features checked 2026-10-28: [Cloudinary pricing](https://cloudinary.com/pricing),
[credit accounting](https://cloudinary.com/documentation/developer_onboarding_faq_credits),
[platform cost coverage](https://cloudinary.com/pricing/compare-plans),
[access mechanisms](https://cloudinary.com/documentation/control_access_to_media),
[Cloudinary backups](https://cloudinary.com/documentation/backups_and_version_management),
[R2 pricing](https://developers.cloudflare.com/r2/pricing/),
[presigning](https://developers.cloudflare.com/r2/api/s3/presigned-urls/),
[S3 compatibility](https://developers.cloudflare.com/r2/api/s3/api/),
[Worker ranged reads](https://developers.cloudflare.com/r2/api/workers/workers-api-reference/),
[cache API](https://developers.cloudflare.com/r2/examples/cache-api/),
[bucket locks](https://developers.cloudflare.com/r2/buckets/bucket-locks/).

### Updated cost using owner-reported files

For 117 MP3s at 30–100 MB **each**, playback storage alone is approximately
3.51–11.70 GB. Under the checked [R2 rates](https://developers.cloudflare.com/r2/pricing/),
this is **$0–$0.03/month** after the single 10 GB Standard allowance and rounding
storage up to whole GB billing units. Without an available allowance, budget
roughly **$0.06–$0.18/month**. These assume full-month storage and decimal MB.
Using MiB instead gives an upper estimate of about $0.05 after the allowance.

Two online copies of these same MP3s total 7.02–23.40 GB, approximately
**$0–$0.21/month** after one allowance and storage rounding. This is a second
playback-file copy, not proof of archival originals or an independent backup.
The paired WAV sizing below now supersedes the earlier unsized-original
assumption. Actual WAV location, availability and provenance remain unresolved.
Do not apply the original-storage placeholders below as owner-reported sizes.

### Five-year growth using owner's projection

Assume all 117 existing files remain, additions are 100–150 files each year,
and new files are 30–100 decimal MB each. This adds **3–15 GB/year**. Bounds
combine the smallest file count/size and largest count/size; they are not a
probability interval or a measured average.

| Point | Total MP3 files | Playback GB | R2 playback storage/month |
| --- | ---: | ---: | ---: |
| Now | 117 | 3.51–11.70 | $0–$0.03 |
| End of year 1 | 217–267 | 6.51–26.70 | $0–$0.26 |
| End of year 3 | 417–567 | 12.51–56.70 | $0.05–$0.71 |
| End of year 5 | **617–867** | **18.51–86.70** | **$0.14–$1.16** |

Costs use the previously checked $0.015/GB-month Standard rate, one available
10 GB account-wide allowance, whole-GB storage rounding and steady full-month
storage at each endpoint. They exclude requests, originals and backups. Without
the allowance, year-five playback storage is approximately **$0.29–$1.31/month**.
Two online copies of these same MP3s at year five total 37.02–173.40 GB, about
**$0.42–$2.46/month** with one allowance. A second same-provider copy still does
not establish independent backup or preserve any separate archival originals.
No optional Worker is included. Growth does not change the R2 planning preference;
entitlement correctness and preservation remain the larger unresolved tasks.

### Paired WAV preservation — included in storage planning

Keep WAV preservation in this decision: it materially changes storage capacity
but does not require a different provider at the projected scale. Recommend
R2 Standard initially, with a **separate private archive bucket** from playback
MP3s. The application playback signer must have no permission to read/sign WAV
objects. Archive upload/recovery uses separate credentials and an explicit
MP3-to-WAV manifest with independent checksums. No public archive endpoint,
routine WAV delivery or WAV transcoding service is planned. This is a design
recommendation, not authorization to create buckets or upload files.

Using decimal MB/GB and one WAV per MP3:

`WAV GB = MP3 GB / 0.15`; `paired GB = MP3 GB × (1 + 1/0.15)`.

| Point | MP3 GB | WAV GB | Combined GB | R2 Standard storage/month |
| --- | ---: | ---: | ---: | ---: |
| Now: 117 pairs | 3.51–11.70 | 23.40–78.00 | **26.91–89.70** | **$0.26–$1.20** |
| Year 5: 617–867 pairs | 18.51–86.70 | 123.40–578.00 | **141.91–664.70** | **$1.98–$9.83** |
| Year 5 midpoint illustration: 742 pairs, 65 MB per MP3 | 48.23 | 321.53 | 369.76 | $5.40 |

Costs use $0.015/GB-month, one available account-wide 10 GB allowance and
whole-GB billing rounding, based on [R2 pricing](https://developers.cloudflare.com/r2/pricing/)
rechecked 2026-10-28. Allowance is shared across the playback and archive buckets,
not repeated. No WAV streaming traffic is assumed. Standard has no retrieval fee
and free egress; occasional restore requests still count toward operation usage.
Original ingestion, recovery labor, tax and independent backup are separate.

An additional WAV copy priced at the same Standard rate would raise combined
MP3 + WAV + second-WAV storage to approximately **$0.62–$2.37/month now**, or
**$3.84–$18.50/month at year five**. This is a budget illustration; another bucket
in the same account/provider does not establish independent disaster recovery.
An offline/offsite original copy remains recommended. Keep both MP3 and WAV
when available: regeneration may differ from the published playback rendition.

R2 Infrequent Access is an optional later archive optimization, not the default:
$0.01/GB-month, $0.01/GB retrieved, 30-day minimum storage, no Standard free
allowance, and higher operation rates ($9/m Class A, $0.90/m Class B, billed in
whole units). At these sizes its savings are modest and recovery/import costs
can outweigh them. Revisit once actual WAV sizes and recovery frequency are
known; a separate cold-storage provider is not needed for the current plan.

Growth adds 20–100 GB/year of WAVs, or **23–115 GB/year including MP3s**, under
the same file-size assumption. With the historical $19–21 application-hosting
estimate, year-five combined primary storage brings the total to roughly
**$20.98–$30.83/month**, before mail/tax/independent backup. The upper case
therefore presses against the under-$30 launch target; it does not justify a
migration to another archive provider now. These five-year endpoint costs are
not a five-year contract or a prediction of listening demand.

Listening examples use a fixed hypothetical 192 kbps and 15% overhead; no bitrate
was supplied. They interpret 30–100 as an audience solely for illustration:

| Scenario | Audience × hours/listener/month | Listening hours | Delivery GB | Assumed reads at 20/hour |
| --- | ---: | ---: | ---: | ---: |
| Low | 30 × 2 | 60 | 5.96 | 1,200 |
| Expected illustration | 60 × 10 | 600 | 59.62 | 12,000 |
| Higher | 100 × 30 | 3,000 | 298.08 | 60,000 |

All have $0 R2 egress and modeled read counts within the 10m monthly allowance,
assuming other account usage has not consumed it. These are not forecasts or
upper bounds on requests. If 30–100 meant simultaneous listeners, 192 kbps is
5.76–19.20 Mbps before overhead; monthly volume still depends on listening hours.
The optional Worker adds $5/month and is unnecessary for the proposed direct
presigned start. The existing hosting bill, original preservation, mail, tax and
migration labor remain separate. At the historical $19–21 hosting estimate,
playback storage would add only cents; paired WAV preservation is costed above.

### Earlier broad scenarios — sensitivity only, superseded by paired-file estimates

These earlier scenarios show how costs grow beyond the reported current files.
They are placeholders, not a forecast or owner-supplied original sizes. Their
20% growth assumption is superseded by the owner's 100–150 files/year above.
Their original-storage assumptions are superseded by the paired WAV model.
Decimal GB; full-month steady
storage; one playback rendition; no hosted transformation; 15% delivery overhead
for buffering/retries/repeated seeks. No cache savings assumed.

| Input | Low | Expected illustration | Higher |
| --- | ---: | ---: | ---: |
| Playback GB (P) | 5 | 25 | 100 |
| Original GB (O), separate from P | 50 | 250 | 1,000 |
| Listening hours/month (H) | 50 | 500 | 2,000 |
| Playback kbps (b) | 128 | 192 | 256 |
| Peak concurrent listeners | 2 | 10 | 30 |
| Peak payload Mbps, before overhead | 0.256 | 1.92 | 7.68 |
| Assumed annual storage growth | 20% | 20% | 20% |
| Delivery GB = H × b × 0.00045 × 1.15 | 3.312 | 49.680 | 264.960 |
| Assumed reads/month = 20 × H | 1,000 | 10,000 | 40,000 |

Original formats are unknown. Their sizes are independent inputs, not inferred
from playback bitrate. Preserve available lossless/source files unchanged; do
not upsample MP3s and call them originals. Bitrate is a cost scenario, not an
approved audio-quality choice.

| Estimated media cost, USD/month | Low | Expected illustration | Higher |
| --- | ---: | ---: | ---: |
| Cloudinary playback credits P + delivery GB, excluding other use | 8.312 | 74.680 | 364.960 |
| Cloudinary capacity-only tier, **not proof of expiring access** | Free $0 | Plus $99 | Advanced $249 |
| Cloudinary token-capable listed tier, before negotiated terms | $249 | $249 | $249 |
| R2 playback only: .015 × max(P−10, 0), rounded storage units | $0.00 | $0.23 | $1.35 |
| R2 playback + one original copy: .015 × max(P+O−10, 0) | $0.68 | $3.98 | $16.35 |
| R2 playback + originals + second original copy: .015 × max(P+2O−10, 0) | $1.43 | $7.73 | $31.35 |
| Optional paid Worker addition | +$5 | +$5 | +$5 |

Cloudinary uses a conservative published 1 GB bandwidth/credit assumption;
actual account/audio accounting must be confirmed before buying. Original files,
backups, existing images and derivatives would consume additional credits if
stored there. All three playback examples fit 600 credits; there is no assumed
linear per-credit overage rate. Reprice above plan limits.

R2 request estimate assumes aggregate Class A below 1m/month and Class B below
10m/month across the account, so $0 operations here. Upload/import requests count
too; multipart upload, retries and seeks increase counts. The one allowance is
shared across buckets; do not apply it again for backups. The second copy above
is priced at the same R2 rate for sizing only: another bucket/account in the same
provider is not independent protection from provider/account failure. An existing
offline independent copy can instead avoid that recurring copy charge, with
hardware/replacement/restore labor still to budget.

Paid Workers have a $5 minimum with 10m monthly requests and 30m CPU-ms included;
overage is $0.30/m requests and $0.02/m CPU-ms. At assumed 5ms/request these cases
fit included usage. Free-tier limits are not relied on for launch. See
[Workers pricing](https://developers.cloudflare.com/workers/platform/pricing/).

With 20% annual growth and unchanged listening, expected R2 P+2O becomes 630 GB:
about $9.30/month after one 10 GB allowance. Doubling listening doubles delivery
GB; R2 bandwidth remains free while Cloudinary credit use rises. Request abuse
and transcode/revision churn are outside these normal-usage scenarios.

These are media estimates, not full hosting bills. Readiness plan's historical
Heroku estimate is $19 with Eco or $21 with Basic (two DBs included), before
mail/domain/tax. At that baseline expected R2 including two original copies is
about $26.73–28.73 combined; optional paid Worker raises that to $31.73–33.73.
Higher original-storage scenario already breaks the launch budget. Existing
allowance usage, tax, other services and current invoices remain unverified.

Migration is mainly labor: inventory/provenance, mapping, checksums, transfer,
access retirement and playback tests. No honest fixed quote without file counts
and owner capacity. At least several bounded 2–4 hour sessions should be allowed,
not a one-click swap. A duplicate playback copy costs roughly P×$0.015/month on
R2 before allowances ($0.08/$0.38/$1.50); source export bandwidth and temporary
Cloudinary usage must be budgeted from approved terms. No migration now.

## Entitlement design proposal

The core listening policy is approved above. Endpoint, grant-source and delivery
mechanisms below remain implementation proposals.

Server rule for issuing playback access:

`published playable track AND (explicitly public OR (valid current session AND
authoritative grant permits this library at now))`.

The current model has no publication/playability lifecycle; define it explicitly
or require a valid registered playback mapping and current `public` flag. Missing
mapping/policy is denied. Do not accept caller user IDs, role/status, object keys
or arbitrary URLs as authority. Admin status alone should not imply paid access
without an owner decision. No signing of archival-original keys.

Proposed POST `/track/:id/playback-access`: existing session and browser-origin/CSRF
controls for private tracks; strict ID lookup; centralized policy; rate limit;
return only `{url, expiresAt}` on allow, `Cache-Control: no-store`. Anonymous
public access may use the same endpoint with an explicit public branch. Return
401 for missing identity on private tracks, 403 for verified but unentitled users,
and fail closed on uncertain entitlement/storage. Do not cache issuance responses
in shared caches or log bearer URLs. Public metadata responses use an explicit
field allowlist, without private locators. Fix both frontend catalog callers,
scope/clear their caches and remove media-object logging in the later task.

**Entitlement source is not solved.** `User.subscriptionActive` is a nullable
string, and Subscription lacks paid-through/freshness evidence. Current webhook
creation writes Subscription then User without an atomic transaction; updates
only change User, with Subscription update commented out; deletion can partially
fail and errors are swallowed. No durable event deduplication/order strategy is
present in this handler. Verified webhook signatures do not solve these defects.
Checkout return and frontend `incomplete` allowance cannot grant media rights.

Production paid grants need a separate billing task: authenticated customer and
approved price/tier binding, idempotent event handling, atomic state/grant updates,
ordering/reconciliation against current Stripe state, paid-through/cancellation
semantics and explicit freshness/failure policy. No raw existing status field
should enable private issuance. Until then, the implementable local contract uses
synthetic authoritative grants and denies unknown/stale billing state. An actual
manual-grant system is an owner policy decision, not an implicit billing bypass.

### Protecting the actual file and handling expiry

Keep R2 private with public development/custom bucket endpoints disabled. Only
the scoped server credential can sign playback GETs. For optional Worker delivery,
use a private binding and validate track/version/expiry and signature on every
request, including HEAD, Range and cache hits. CORS, referrer restrictions,
unguessable IDs and player controls are supplementary, not authorization.

Treat temporary URLs as bearer capabilities: anyone receiving one can request
that object until expiry. Do not bind routinely to IP (mobile networks change).
Use immutable rendition versions; include the selected object/version in scope.
Public tracks can have durable cached URLs if the owner intends permanent public
availability; retaining the access endpoint for all tracks simplifies later policy
changes. Making public audio private cannot recover copies already delivered.

Two-hour TTL is accepted for planning, pending final implementation review.
Renew before expiry (e.g. 90 seconds) and after
background/resume when needed, rechecking the session and current grant each
time. New range requests/seeks can fail after expiry even if buffered playback
continues. Do not assume expiry terminates an in-flight transfer. Browser/provider
behavior at that boundary needs synthetic tests. A URL alone cannot revoke bytes
already buffered/downloaded, and a complete transfer may outlive the expiry.

A new URL on HTMLAudioElement can reload media. Preserve track/version, currentTime
and play/pause intent; wait for loadedmetadata, restore position and handle play()
errors. Ignore stale responses after track change/logout and limit retries. Stop
on denied renewal with an understandable login/subscription message. A 4-hour
recording must survive renewal without restarting; paused tabs must recheck before
seeking. Shorter TTL reduces new-request sharing time but increases renewal work.

Subscription cancellation at period end follows the approved paid-through policy;
revocation/expiry prevents new issuance immediately once authoritative state
reflects it, but existing URL capabilities retain their remaining lifetime.
Immediate per-request revocation needs a stateful gateway/check, additional
latency and operations, and still cannot retract delivered audio.

Existing bypasses to retire in a later authorized cutover: full-catalog URL
responses; old Cloudinary upload URLs in historical seeds/browser caches/logs;
old versions, derived/transformed copies, alternate delivery aliases and any
public bucket/domain added during migration. Creating a new private copy or
removing a URL from the API does not disable the old copy. Actual reachability is
unknown. Inventory and verify denial of old paths with owner permission; invalidate
provider caches and retire public copies only after preservation/recovery is proven.
Do not claim closure based on one newly signed path. Authorized listeners can
retain or record delivered audio; this design is access control, not copy prevention.

## Bounded next work (separately approved)

1. **Next implementable local task:** centralized playback policy + issuance
   contract with fake authoritative entitlement, fake signer and synthetic media;
   deny unknown/stale billing; whitelist catalog response fields. No deployed
   paid-access claim. Provider selection can remain behind a tiny adapter.
2. Separate billing consistency task establishes the trusted grant source before
   paid launch. No remote Stripe/DB operations implied.
3. Local player integration: access issuance, renewal, cancellation/race handling,
   reliable duration/events and the identified index-zero/filtered-ID navigation
   defects. Use real browser audio against synthetic local ranged responses.
4. Only after approval: bounded provider metadata inventory (plan/features,
   aggregate storage/usage, format/duration distribution, delivery/access types,
   backup coverage; no URL/credential/customer output). Protected-media tests
   require separate explicit authorization. No restoration prerequisite for local work.
5. If R2 approved: prepare immutable asset mapping (provider, key/public ID,
   resource/delivery type where applicable, version, size/duration/codec/checksum,
   separate original locator). Validate schema changes on disposable DB only.
   Inventory originals → independently preserve/checksum → copy approved playback
   files → verify counts/bytes/checksums and metadata → switch a bounded test set
   → test access/seeking/renewal → retire legacy public paths with approval.
   Retain a mapping/manifest for recovery. Rollback must use a protected previous
   version or disable private playback, never silently restore public bypasses.
6. Recovery: retain unchanged originals plus independent offline/offsite copy;
   preserve catalog-to-original manifest and checksums, import/transcode recipe,
   dates/source rights, and catalog backups. Use read-only playback credentials
   distinct from backup writers/deleters. Rehearse restoring one complete original
   and regenerating its playback copy before declaring recovery verified.

### Meaningful acceptance tests for the future task

| Allowed | Denied / boundaries |
| --- | --- |
| Anonymous public track; valid session + fresh approved grant for private track | API key alone; missing/unknown/expired/revoked session; deleted/changed-email account; current but unentitled user |
| Approved paid-through cancellation until exact end | Exact grant expiry, revoked grant, unknown/stale source, DB/signer failure; spoofed user/status/admin/object path; incomplete/unpaid and unapproved grace |
| Valid scoped GET and Range; first/middle/suffix bytes match synthetic fixture; correct 206/Content-Range/length/type; HEAD where authorized | Unsigned, tampered, expired or wrong-object/version URLs; original-file access; unsigned direct origin/public alias; invalid range 416; authorized HEAD must not authorize a separate unsigned GET |
| Public cache and authorized private cache hit (if Worker used) | Warm-cache access with no/expired capability; token stripped; another object substituted; public-to-private visibility change with old paths |
| Chrome/Firefox/Safari/mobile: 4-hour synthetic recording; seek beyond buffer; pause past expiry; resume; renewal restores position | Denied renewal stops further loading; no infinite retries, restart at zero or token logging; offline/error feedback |
| First filtered track (index 0), noncontiguous IDs, next/previous/ended behavior, rapid A→B→A | Late issuance/renewal cannot switch current track; logout/status loss clears private selection/cache and blocks new issuance |

Copied valid URLs are expected to work until expiry under the proposed bearer
policy; expired **new** requests must fail. Test both explicitly. Distinguish
request-time expiry from already buffered/in-flight bytes. Local fake-provider
tests establish application logic only; owner-approved provider tests are still
required before calling file enforcement verified. No tests accessing services
or application startup were run in this planning session.
