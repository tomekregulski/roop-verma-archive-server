require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
// const jwt = require('jsonwebtoken');
// const { User } = require('../../models');

const YOUR_DOMAIN = 'http://localhost:5173';

module.exports = {
  checkoutSession: async (req, res, next) => {
    const { stripeId } = req.params;

    console.log('get checkout session');
    try {
      const session = await stripe.checkout.sessions.create({
        customer: stripeId,
        line_items: [
          {
            price: 'price_1MdMKqBlr8UFcXJy83qKfDmx',
            // price: product,
            // For metered billing, do not pass quantity
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: `${YOUR_DOMAIN}/complete-registration?success=true&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${YOUR_DOMAIN}/complete-registration?canceled=true`,
      });

      console.log(session);
      console.log('end get checkout session');
      res.status(200).json({ ...session });
    } catch (error) {
      next(error);
    }
  },
};
