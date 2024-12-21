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
