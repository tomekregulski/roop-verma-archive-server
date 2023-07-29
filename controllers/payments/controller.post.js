require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { PrismaClient } = require('@prisma/client');
// const bodyParser = require('body-parser');

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
  webhooks: async (req, res, next) => {
    const event = req.body;
    switch (event.type) {
      case 'customer.updated': {
        console.log('customer.updated');
        const stripeId = event.data.object.id;
        console.log(stripeId);

        break;
      }
      case 'payment_method.updated': {
        const data = event.data.object;
        console.log('payment_method.updated');
        // console.timeLog(data);
        break;
      }
      case 'customer.subscription.updated': {
        const data = event.data;
        // console.timeLog(data);
        break;
      }
      case 'customer.subscription.paused': {
        const data = event.data;
        // console.timeLog(data);
        break;
      }
      case 'customer.subscription.resumed': {
        const data = event.data;
        // console.timeLog(data);
        break;
      }
      case 'customer.subscription.deleted': {
        console.log('customer.subscription.deleted');
        const stripeId = event.data.object.id;

        const userData = await prisma.user.update({
          where: {
            stripeId,
          },
          data: {
            subscriptionActive: false,
          },
        });
        break;
      }
      // ... handle other event types
      default:
        console.log(`Unhandled event type ${event.type}`);
    }
    //     // Return a response to acknowledge receipt of the event
    res.status(200).json({ received: true });
  },
};
