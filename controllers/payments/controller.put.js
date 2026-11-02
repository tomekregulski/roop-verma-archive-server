const { stripe } = require('../../billing/runtime');
const { wrap } = require('../../identity/http');

module.exports = {
  // The route's subscriptionOwner guard validates the subscription and method
  // before this handler runs. Attaching a method establishes no paid access.
  updatePaymentMethod: wrap(async (req, res) => {
    const paymentMethod = await stripe.paymentMethods.attach(req.body.payment_method, {
      customer: req.identity.user.stripeId,
    });
    await stripe.customers.update(req.identity.user.stripeId, {
      invoice_settings: { default_payment_method: paymentMethod.id },
    });
    res.json({ message: 'payment method successfully updated' });
  }),
};
