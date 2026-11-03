# Current billing reader — C1, 2026-11-02

Normal composition uses `billing/paid-access.js` with the shared PostgreSQL
maximum-15-minute cache clipped to the verified paid-period end, terminal
cancellation veto and no stale-on-error extension;
[BILLING_API.md](BILLING_API.md) contains the flow and approved lifecycle rules.
Playback rereads entitlement after mapping, before signing. Absent/ineligible
coverage is 403; storage, ownership or environment inconsistency is 503. Public
tracks require no identity/billing read. Delivery adapters remain unavailable, so
normal runtime issues no media URL. The two-hour URL contract and dated browser
evidence below remain; latest backend checks are in [test/README.md](test/README.md).

# Local playback access contract — 2026-10-28

Implemented locally; service restoration remains deferred. This contract does
**not** establish protection of live private media. Provider approval, real
signing/delivery, trustworthy billing entitlements and retirement of old public
URLs remain prerequisites. No provider dependencies or schema changes were added.

## HTTP contract

`POST /api/v1/track/:trackId/playback-access/:key`

- `trackId` is the positive, 32-bit **Track.id primary ID**, not the historical
  Track.trackId catalog number. `:key` remains public compatibility configuration.
- Content-Type: application/json; body exactly `{}`; no query parameters.
- Send `X-RVDL-CSRF: 1`. Supplied Origin must exactly match CLIENT_URL. Browser
  callers send credentials; identity comes only from the existing HttpOnly cookie.
- Success: 200, `Cache-Control: no-store`, exactly
  `{trackId: number, url: string, expiresAt: ISO-8601 UTC string}`.
  The URL is an HTTPS bearer capability for the selected MP3. No provider,
  bucket, key, original locator, subscription fields or credentials are returned.
- Expiry requested from the signer is two hours after the issuance clock reading.
  It is not capped to the remaining paid period: an already-issued URL may remain
  usable after cancellation/entitlement/session expiry until URL expiry. Future
  issuance requires a fresh decision. This does not promise instant revocation.

| Status | Meaning |
| --- | --- |
| 400 | Invalid ID, non-JSON/nonempty body, or query input |
| 401 | Subscriber request has no valid session (absent, invalid, expired or revoked) |
| 403 | CSRF/origin/key rejected, or no explicit current paid entitlement |
| 404 | Track ID not found |
| 503 | Visibility, entitlement source, asset mapping or signing unavailable/invalid |
| 500 | Unexpected storage/session lookup failure; no successful issuance |

Errors use the existing `{error: {message}}` envelope and generic 5xx message.
Ordinary parser errors retain existing 400/413 handling. Issuance handler
responses are no-store; invalid bodies can fail earlier in the shared parser.
No signed URLs or request credentials are logged by this new flow.

## Server policy and adapter boundaries

`playback/service.js` reads `{id, public}` from Prisma. `public === true` needs
no entitlement or session; anonymous callers and callers with stale/invalid cookies
are allowed. `public === false` requires the
persisted, current identity session and a current paid interval. Null/unknown
visibility fails closed. Authentication uses existing opaque-session validation,
including revocation, exact expiry, user deletion and changed-email invalidation.
No body, query, JWT header, subscription status, user ID, admin role or asset URL
supplied by a caller establishes playback authority. Playback telemetry is
unchanged and does not grant access.

The small factory takes three server-owned asynchronous adapters:

1. `readEntitlement(userId)` returns `null` when absent, throws when unavailable,
   or returns exactly `{kind: 'paid', userId, paidFrom: Date, paidThrough: Date,
   cancelled?: boolean}`. The interval is inclusive at paidFrom and exclusive at
   paidThrough. Extra/contradictory fields, arrays, foreign user IDs, malformed,
   future and expired intervals deny. A cancellation marker does not truncate a
   paid interval. Persisted entitlement is reread and the paid boundary rechecked after asset mapping, before signing.
2. `resolveAsset(trackId)` returns a server-controlled playback mapping
   `{trackId, namespace: 'playback', key: 'playback/<opaque-name>.mp3',
   contentType: 'audio/mpeg'}`. Key names allow letters, numbers, `_` and `-`;
   nested paths, URL/query encodings, traversal and WAVs are rejected. Track.url
   is never read as a fallback. Mapping persistence/provisioning is incomplete.
3. `signPlayback({asset: {namespace, key, contentType}, expiresAt: Date})` returns
   an HTTPS URL or throws. The service copies only these three asset fields into
   the signer input; clients and mappings cannot choose a bucket or archive
   credential. The future provider adapter must bind a fixed private playback
   bucket and read-only GET signing credentials without archive access.

**Delivery integration remains incomplete.** `playback/runtime.js` uses the real
Stripe-led billing reader and unavailable asset/signing adapters. Even public
tracks receive 503 until delivery exists. A verified subscriber without a current
paid interval receives 403; an eligible paid subscriber reaches unavailable
delivery and receives 503. No display/subscription status grants playback.
Cancellation and owner exceptions follow the linked D1–D10 billing contract.

The separate private WAV archive and playback credential separation require actual
provider enforcement later; a filename/interface check cannot prove contents or
bucket policy. Gifts, pauses/collection pauses, credits, discounts, plan changes
and admin exceptions introduce no new grants in this initial scope.

## Catalog and frontend compatibility

`catalog/response.js`, mounted before v1 routers, projects successful catalog
responses to explicit metadata fields and relations for Track, Artist, Category,
Location, MediaType, Event, Tape and Raga. Projection covers both track GETs,
management `{data}` responses, nested track relations, and case-insensitive route
variants. `url`, `master`, unknown storage fields and unknown future fields are
omitted. Track metadata includes ID/relationships, visibility, plays, musical
sections, accompaniment, notes and audio quality. Related records retain catalog
names, dates, categories and locations. Metadata visibility policy is unchanged:
the full catalog GET remains API-key-only; the public GET filters public tracks.
Whether subscriber metadata should itself be restricted remains an owner choice.

All catalog responses use no-store. Client and server must be released together:
old clients depend on Track.url; the updated client depends on this endpoint.
Admin writes still accept the existing URL input behind the existing admin guard,
but no longer echo storage details. No migration or old provider-path retirement
has occurred; historical seeds, copies, caches and old builds can retain URLs.

The sibling React client issues on selection using only Track.id. It has one
catalog owner (no duplicate infinitely cached query), chooses the public catalog
for anonymous browsing and full metadata for logged-in browsing, and does not
use display subscription statuses as playback authority. Track/account changes
pause and remove the old source before paint, cancel requests and ignore late
results. Denial/network/media errors and rejected play promises show inline
recovery guidance. Metadata events establish duration. Unavailable Play stays
focusable with an explanation and guarded activation. Navigation retains actual
filtered-array indices, including zero/noncontiguous track IDs.

URL expiry clears local audio and offers **manual** Retry playback, which obtains
a new decision. Seamless long-recording renewal, preservation of seek position
across replacement, buffered-range seeking, pause/resume across expiry, stalled
recovery and automatic continuation are not certified or completed here. Current
retry starts a fresh media element. These remain explicit player/delivery work.
Client timers are UX behavior, never proof of provider-enforced expiration.

## Test isolation and evidence

`test/support/identity-http.js` injects adapters through its existing module-loader
harness only. Normal app entry points never import test fixtures. There is no
HTTP grant endpoint, public test flag, env switch or deployed fake signer. The
browser test's Axios/Audio doubles live under the sibling client's test directory
and are not imported or bundled by the normal application entry point.

Node 24.19.0: `node --test test/*.test.js` (the npm test script's command):
**166 pass**, including all 140 prior checks and 26 playback/runtime checks.
Actual Express/parsers/cookies/identity/controllers/routes are exercised with
in-memory data, fake mail/Stripe and a recording fake signer. Cases cover public
anonymous issuance, session invalidity/revocation, paid access, cancellation
through its exact end, unapproved/missing/unavailable/ambiguous grants, spoofed
inputs, asset substitution, archive/WAV rejection and no signer calls on
pre-signing denials. Successful signer calls assert intended asset and expiry.
The normal runtime separately proves 503 with no fake/legacy URL fallback.
Catalog GET, mutation, nested and uppercase paths are checked for locator removal.

React browser harness: **23 assertions pass** under StrictMode in the in-app
browser, using actual providers/player components with test-only Axios and Audio
doubles. This verifies request shape, stale responses, filtered navigation,
denials, failed play/media, expiry/retry, identity changes and logout. It is not an
end-to-end browser-to-provider delivery test. Client TypeScript, nonmutating ESLint,
Vite test-mode build, 14 existing frontend unit checks, syntax checks for new
server modules and git diff checks pass. Existing build warnings: outdated browser
compatibility data and a main chunk over 500 kB. See the sibling
[frontend handoff](../roop-verma-archive-client/PLAYBACK_HANDOFF.md).

No real database, private media, mail, Stripe, R2 or Cloudinary requests occurred.
Fake signatures cannot establish storage authorization, actual URL expiration,
Range/206 responses, CORS, browser seeking or long-recording playback. Provider
approval and separately authorized verification must establish these, plus
unsigned/wrong-object/WAV denial and legacy delivery-path retirement. No service
restoration, billing changes, migration, uploads, purchase, deployment, push or
merge was performed.
