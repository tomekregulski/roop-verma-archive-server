require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

module.exports = {
  newUser: async (req, res, next) => {
    const { firstName, lastName, email, isAdmin = false } = req.body;

    try {
      const existingUser = await prisma.user.findUnique({
        where: {
          email: email,
        },
      });

      console.log('existingUser', existingUser);

      if (existingUser) {
        const error = new Error('A user with that email already exists');
        error.status = 401;
        throw error;
      }

      // // should we check for existing stripe user for _reasons_?

      const stripeCustomer = await stripe.customers.create({
        name: `${firstName} ${lastName}`,
        email: email,
      });

      if (!stripeCustomer) {
        const error = new Error('Server Error: Could not create customer.');
        error.status = 500;
        next(error);
      }

      const userData = {
        email: email,
        firstName: firstName,
        lastName: lastName,
        subscriptionActive: false,
        stripeId: stripeCustomer.id,
        isAdmin: isAdmin,
      };

      console.log('userData', userData);
      const user = await prisma.user.create({ data: { ...userData } });
      console.log(user);
      console.log('end of  newUser endpoint');

      res.status(200).json({ ...userData, token: '123456' });
    } catch (err) {
      next(err);
    }
  },

  createPortalSession: async (req, res, next) => {
    console.log('portal');
    console.log(req.body.customerId);
    const session = await stripe.billingPortal.sessions.create({
      customer: req.body.customerId,
      return_url: 'http://127.0.0.1:3000/account',
    });

    console.log(session);

    // return session;
    res.status(200).json({ session });
  },
};
