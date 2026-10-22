require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { PrismaClient } = require('@prisma/client');
// const { getUserByStripeId } = require('../../prisma/queries/user');
// const {
//   getSubscriptionByStripeId,
// } = require('../../prisma/queries/subscription');
// const bodyParser = require('body-parser');

const prisma = new PrismaClient();

const subscriptionStatuses = {
  TRIALING: 'trialing', // N/A
  ACTIVE: 'active',
  INCOMPLETE: 'incomplete',
  INCOMEPLETE_EXPIRED: 'incomplete_expired',
  PAST_DUE: 'past_due',
  CANCELLED: 'cancelled',
  UNPAID: 'unpaid',
  PAUSED: 'paused',
};

module.exports = {
  sessionObject: async (req, res, next) => {
    const { firstName, lastName, email, isAdmin = false, sessionId } = req.body;
    try {
      const session = await stripe.checkout.sessions.retrieve(sessionId);

      res.status(200).json({ ...session });
    } catch (error) {
      next(error);
    }
  },
  webhooks: async (req, res, next) => {
    const secret = process.env.STRIPE_WEBHOOK_SECRET;
    if (typeof secret !== 'string' || !secret.trim()) {
      return res.status(503).json({ error: { message: 'Webhook is not configured' } });
    }
    const signature = req.headers['stripe-signature'];
    if (!Buffer.isBuffer(req.body) || typeof signature !== 'string') {
      return res.status(400).json({ error: { message: 'Invalid webhook' } });
    }
    let event;
    try {
      // SDK verifies the signature and timestamp (default tolerance: 300 seconds)
      // before parsing. Dispatch only the event returned by verification.
      event = stripe.webhooks.constructEvent(req.body, signature, secret);
    } catch (_error) {
      // SDK errors can contain the signature and payload; never log/return them.
      return res.status(400).json({ error: { message: 'Invalid webhook' } });
    }
    switch (event.type) {
      case 'customer.created': {
        const data = event.data.object;
        const requestInfo = event.request;
        const stripeId = data.id;

        const splitName = data.name.split(' ');
        const firstName = splitName[0];
        const lastName = splitName[1];

        const user = {
          email: data.email,
          firstName,
          lastName,
          stripeId,
          isAdmin: false,
        };
        try {
          await prisma.user.create({
            data: user,
          });
        } catch (e) {
          // DISPATCH EMAIL WITH ERROR AND USER INFO
          // LOG ERROR
        }
        break;
      }
      case 'customer.updated': {
        break;
      }
      case 'customer.deleted': {
        const data = event.data.object;
        const requestInfo = event.request;
        const stripeId = data.id;
        try {
          const prismaUser = await prisma.user.findUnique({
            where: {
              stripeId: stripeId,
            },
          });

          if (prismaUser) {
            try {
              const deleted = await prisma.user.delete({
                where: {
                  stripeId: stripeId,
                },
              });
              // need to cascade up to subscriptions
              // need to emit event to client to log out
            } catch (e) {
            }
          } else {
          }
        } catch (e) {
          // DISPATCH EMAIL WITH ERROR AND USER INFO
          // LOG ERROR
        }
        break;
      }
      // case 'payment_method.updated': {
      //   // N/A ATM
      //   break;
      // }
      case 'customer.subscription.created': {
        const data = event.data.object;
        const requestInfo = event.request;
        const stripeId = data.customer;

        const prismaUser = await prisma.user.findUnique({
          where: {
            stripeId: stripeId,
          },
        });

        // STOP THIS
        // JUST ADD
        // subscriptionId, cancelAt, and status to user model
        const newSubscription = {
          id: data.id,
          name: data.plan.product,
          userId: prismaUser.id,
          stripeId,
          priceId: '1234567',
          productId: '123456',
          status: data.status,
          // figure out cancel_at
          cancelAt: data.cancel_at,
        };


        const newSub = await prisma.subscription.create({
          data: newSubscription,
        });

        const updatedUser = await prisma.user.update({
          where: {
            stripeId: stripeId,
          },
          data: {
            // subscriptions: newSubscription,
            // TODO: what status levels are available?
            subscriptionActive: data.status,
          },
        });
        break;
      }

      case 'customer.subscription.updated': {
        const resData = event.data.object;
        const requestInfo = event.request;
        const stripeId = resData.customer;

        try {
          const prismaUser = await prisma.user.findUnique({
            where: {
              stripeId: stripeId,
            },
          });

          // const subscriptionData = {
          //   userId: prismaUser.id,
          //   stripeId,
          //   priceId: '1234567',
          //   productId: '123456',
          //   status: resData.status,
          //   cancelAt: resData.cancel_at,
          // };



          // const updatedSub = await prisma.subscription.update({
          //   data: subscriptionData,
          // });


          const updatedUser = await prisma.user.update({
            where: {
              stripeId,
            },
            data: {
              subscriptionActive: resData.status,
            },
          });

        } catch (e) {
          // DISPATCH EMAIL WITH ERROR AND USER INFO
          // LOG ERROR
        }
        break;
      }
      // case 'customer.subscription.paused': {
      //   // N/A ATM
      //   break;
      // }
      // case 'customer.subscription.resumed': {
      //   // N/A ATM
      //   break;
      // }
      case 'customer.subscription.deleted': {
        const data = event.data.object;
        const requestInfo = event.request;
        const stripeId = data.customer;

        try {
          const prismaUser = await prisma.user.findUnique({
            where: {
              stripeId: stripeId,
            },
          });

          const deletedSub = await prisma.subscription.delete({
            where: {
              userId: prismaUser.id,
            },
          });

          const userData = await prisma.user.update({
            where: {
              stripeId,
            },
            data: {
              subscriptionActive: data.status,
            },
          });
          // need to emit event to client to log out
        } catch (e) {
          // DISPATCH EMAIL WITH ERROR AND USER INFO
          // LOG ERROR
        }
        break;
      }
      // case 'invoice.payment_action_required':
      // case 'invoice.payment_failed':
      // case 'subscription_schedule.aborted':
      // case 'subscription_schedule.canceled':
      // case 'subscription_schedule.expiring	':
      // ... handle other event types
      default:
    }
    //     // Return a response to acknowledge receipt of the event
    res.status(200).json({ received: true });
  },
};
