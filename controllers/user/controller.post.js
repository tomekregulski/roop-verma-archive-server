require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

module.exports = {
  newUser: async (req, res, next) => {
    const { firstName, lastName, email, isAdmin = false } = req.body;

    try {
      // Check if user with incoming email already exists
      const existingUser = await prisma.user.findUnique({
        where: {
          email: email,
        },
      });

      // if exists, return
      if (existingUser) {
        console.log('existingUser', existingUser);
        const error = new Error('A user with that email already exists');
        error.status = 401;
        throw error;
      }

      // Should we check for existing stripe user?
      // Probably not - email check should be enough
      const stripeCustomer = await stripe.customers.create({
        name: `${firstName} ${lastName}`,
        email: email,
      });

      if (!stripeCustomer) {
        const error = new Error(
          'Server Error: Stripe could not create customer.'
        );
        // P0 - LOG AND NOTIFY
        error.status = 500;
        next(error);
      }

      const newUserStripeId = stripeCustomer.id;

      res.status(200).json({ newUserStripeId, token: '123456' });
    } catch (err) {
      next(err);
    }
  },

  /// Is this used anywhere?
  createPortalSession: async (req, res, next) => {
    console.log('portal');
    console.log(req.body.customerId);
    const session = await stripe.billingPortal.sessions.create({
      customer: req.body.customerId,
      return_url: `${process.env.CLIENT_URL}/manage-account`,
    });

    console.log(session);

    // return session;
    res.status(200).json({ session });
  },
};
