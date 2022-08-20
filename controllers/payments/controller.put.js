require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

module.exports = {
  updatePaymentMethod: async (req, res, next) => {
    console.log('attaching payment method...');
    const { stripe_id, subscription_id, payment_method } = req.body;

    if (!subscription_id) {
      const error = new Error('Did not receive a valid subscription ID');
      error.status = 500;
      next(error);
    }
    if (!payment_method) {
      const error = new Error('Did not receive a valid payment method');
      error.status = 500;
      next(error);
    }

    try {
      const paymentMethod = await stripe.paymentMethods.attach(payment_method, {
        customer: stripe_id,
      });

      const customer = await stripe.customers.update(stripe_id, {
        invoice_settings: { default_payment_method: paymentMethod.id },
      });

      res.status(200).json({
        message: 'payment method successfully updated',
      });
    } catch (error) {
      next(error);
    }
  },
};
