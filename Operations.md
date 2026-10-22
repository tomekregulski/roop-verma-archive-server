# Current identity operations

Use [IDENTITY_API.md](IDENTITY_API.md) and [test/README.md](test/README.md) for configuration, local checks and the manual walkthrough. Provider sender setup and a designated test inbox remain pending; no real delivery has been verified. The local demo never loads real service credentials. No remote migration or cleanup has been run.

## Webhook authenticity — local verification, 2026-10-22

`POST /api/v1/payment/webhooks` requires `Stripe-Signature` and the server-only
`STRIPE_WEBHOOK_SECRET`. Set it through server environment/secret management;
the placeholder in `.env.example` is not a usable secret. This is the endpoint's
`whsec_...` signing secret, **not** `STRIPE_SECRET_KEY` (the API key). Use the
secret for the exact endpoint and environment. Dashboard-managed endpoints and
CLI listeners have different secrets; test and live endpoints also differ.
Never put it in frontend configuration, source control, request bodies or logs.

The app preserves the raw JSON body before shared parsing, retaining the existing
16 KB limit and rejecting compressed bodies to avoid transforming signed bytes.
The locked Stripe 17.5.0 SDK's `constructEvent` verifies the body/header/secret
and applies its default 300-second timestamp tolerance before returning the
event used by the existing billing switch. Missing/blank configuration returns
503; missing, invalid, stale or body-mismatched signatures return 400. Rejections
perform no database reads/writes or downstream Stripe calls. Responses are
generic; the webhook does not log signatures, SDK errors or event/customer data.
Other JSON routes retain normal parsing.

Required setup and deployment verification **remain pending**. Before enabling
deliveries in a separately authorized deployment, configure the correct endpoint
signing secret, confirm the deployed commit/runtime and HTTPS/proxy accessibility,
header/raw-body preservation, server clock accuracy, existing event subscriptions
and snapshot payload/API-version compatibility. Verify legitimate processing
using a designated Stripe test environment and confirm rejection of unsigned
and tampered requests without service effects. Record sanitized outcomes only.
No hosted setting or infrastructure was inspected or changed here, and no real
Stripe event was sent. A missing secret deliberately prevents webhook processing.

Signature verification does not provide duplicate-event handling, event ordering,
synchronization, retries/reconciliation, atomic writes, account-deletion versus
billing policy, or other lifecycle correctness. Existing swallowed failures,
uncaught async errors and placeholder billing fields remain deferred; existing
verified-event behavior is preserved. Backend/billing beta readiness is not
established. See [BACKEND_BASELINE.md](BACKEND_BASELINE.md) for remaining blockers.

References checked 2026-10-22: Stripe's [snapshot verification example](https://docs.stripe.com/events/set-up-events),
[Express middleware ordering and endpoint-secret guidance](https://docs.stripe.com/events/manage-webhook-endpoints#signature-errors),
[Node SDK signing/test headers](https://github.com/stripe/stripe-node#webhook-signing),
and [17.5.0 verification/timestamp implementation](https://github.com/stripe/stripe-node/blob/v17.5.0/src/Webhooks.ts).

---

The notes below are historical and include obsolete commands and the former browser EmailJS flow.

Start server: npm run sstart
Start client: pnpm run dev
Stat HTTPS forwarding: ngrok http http://localhost:8080
Start Stripe webhooks: {httpsUrl}/api/v1/payment/webhooks

- customer.created
- customer.updated
- customer.deleted
- product.created
- product.updated
- product.deleted
- customer.subscription.created
- customer.subscription.updated
- customer.subscription.paused
- customer.subscription.resumed
- customer.subscription.deleted

Test Login

- Enter email address
- If "invalid grant" error - reconnect Gmail service in MailJS

Confirmed Customer Lifecycle:

- Regitration through Stripe sessions
- Local DB creates customer through Stripe webhooks
- Daily subscription runs
- Customer can pause/resume
- WHAT HAPPENS WHEN CUSTOMER PAUSES?
  - Expected: upon next refresh, loses access to private tracks but can still log in
- If customer is deleted from Stripe Dashboard, DB updates accordingly and customer is logged out upon next refresh
