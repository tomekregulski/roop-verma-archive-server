require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const jwt = require('jsonwebtoken');
const { User } = require('../../models');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

module.exports = {
  sessionObject: async (req, res, next) => {
    const { firstName, lastName, email, isAdmin = false, sessionId } = req.body;
    console.log('checkout session object');
    console.log(sessionId);
    console.log({ firstName, lastName, email });
    try {
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      console.log(session);
      console.log('end of checkout session object endpoint');

      res.status(200).json({ ...session });
    } catch (error) {
      next(error);
    }
  },
};
