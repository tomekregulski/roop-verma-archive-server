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
