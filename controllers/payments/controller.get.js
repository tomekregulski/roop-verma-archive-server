require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { PrismaClient } = require('@prisma/client');
// const jwt = require('jsonwebtoken');
// const { User } = require('../../models');
const prisma = new PrismaClient();

const YOUR_DOMAIN = process.env.CLIENT_URL;

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
  checkoutSessionResubscribe: async (req, res, next) => {
    const { stripeId } = req.params;

    console.log('get checkout resubscribe session');
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
        success_url: `${YOUR_DOMAIN}/manage-account?account-updated`,
        cancel_url: `${YOUR_DOMAIN}/manage-account`,
      });

      console.log(session);
      console.log('end resubscribe checkout session');
      res.status(200).json({ ...session });
    } catch (error) {
      next(error);
    }
  },
  webhookLogs: async (req, res, next) => {
    try {
      const logs = await prisma.webhookLog.findMany({});
      console.log(logs);
      res.status(200).json({ data: logs });
    } catch (error) {
      next(error);
    }
  },
};
