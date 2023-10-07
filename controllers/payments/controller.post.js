require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { PrismaClient } = require('@prisma/client');
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
    console.log('webhook');
    const event = req.body;
    console.log(event);
    switch (event.type) {
      case 'customer.created': {
        const data = event.data.object;
        const requestInfo = event.request;
        const stripeId = data.id;
        console.log(data);
        console.log(requestInfo);
        console.log(stripeId);

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
        console.log(user);
        try {
          await prisma.user.create({
            data: user,
          });
          console.log('CUSTOMER_CREATED');
        } catch (e) {
          // DISPATCH EMAIL WITH ERROR AND USER INFO
          // LOG ERROR
          console.log(`error creating user ${data.name} - ${stripeId}`);
          console.log(e);
        }
        break;
      }
      case 'customer.updated': {
        console.log('customer updated');
        break;
      }
      case 'customer.deleted': {
        console.log('CUSTOMER_DELETED');
        const data = event.data.object;
        const requestInfo = event.request;
        const stripeId = data.id;
        console.log(data);
        console.log(requestInfo);
        console.log(stripeId);
        try {
          const prismaUser = await prisma.user.findUnique({
            where: {
              stripeId: stripeId,
            },
          });
          console.log('prismaUser');
          console.log(prismaUser);

          if (prismaUser) {
            try {
              const deleted = await prisma.user.delete({
                where: {
                  stripeId: stripeId,
                },
              });
              console.log('deleted');
              console.log(deleted);
              console.log(`successfully deleted user ${stripeId}`);
            } catch (e) {
              console.log(`error deleting user ${stripeId}`);
              console.log(e);
            }
          } else {
            console.log(`user ${stripeId} does not exist in DB`);
          }
        } catch (e) {
          // DISPATCH EMAIL WITH ERROR AND USER INFO
          // LOG ERROR
          console.log(e);
        }
        break;
      }
      // case 'payment_method.updated': {
      //   // N/A ATM
      //   break;
      // }
      case 'customer.subscription.created': {
        console.log('SUBSCRIPTION_CREATED');
        const data = event.data.object;
        const requestInfo = event.request;
        const stripeId = data.customer;
        console.log(data);
        console.log(requestInfo);
        console.log(stripeId);

        const prismaUser = await prisma.user.findUnique({
          where: {
            stripeId: stripeId,
          },
        });

        console.log(prismaUser);
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

        console.log('NEW_SUBSCRIPTION');
        console.log(newSubscription);

        const newSub = await prisma.subscription.create({
          data: newSubscription,
        });
        console.log(newSub);

        const updatedUser = await prisma.user.update({
          where: {
            stripeId: stripeId,
          },
          data: {
            // subscriptions: newSubscription,
            // TODO: what status levels are available?
            subscriptionActive: data.status === 'active',
          },
        });
        console.log(updatedUser);
        break;
      }

      case 'customer.subscription.updated': {
        console.log('SUBSCRIPTION_UPDATED');
        const data = event.data.object;
        const requestInfo = event.request;
        const stripeId = data.customer;
        console.log(data);
        console.log(requestInfo);
        console.log(stripeId);

        try {
          const prismaUser = await prisma.user.findUnique({
            where: {
              stripeId: stripeId,
            },
          });

          const subscriptionData = {
            userId: prismaUser.id,
            stripeId,
            priceId: '1234567',
            productId: '123456',
            status: data.status,
            cancelAt: data.cancel_at,
          };

          console.log('SUBSCRIPTION_DATA');
          console.log(subscriptionData);

          console.log(prismaUser);

          const updatedSub = await prisma.subscription.update({
            data: subscriptionData,
          });

          console.log(updatedSub);

          const updatedUser = await prisma.user.update({
            where: {
              stripeId,
            },
            data: {
              subscriptions: [newSubscription],
              // TODO: what status levels are available?
              subscriptionActive: data.status === 'active',
            },
          });

          console.log(updatedUser);
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
        console.log('SUBSCRIPTION_DELETED');
        const data = event.data.object;
        const requestInfo = event.request;
        const stripeId = data.customer;
        console.log(data);
        console.log(requestInfo);
        console.log(stripeId);

        try {
          const prismaUser = await prisma.user.findUnique({
            where: {
              stripeId: stripeId,
            },
          });
          console.log(prismaUser);

          const deletedSub = await prisma.subscription.delete({
            where: {
              userId: prismaUser.id,
            },
          });
          console.log(deletedSub);

          const userData = await prisma.user.update({
            where: {
              stripeId,
            },
            data: {
              subscriptionActive: false,
            },
          });
          console.log(userData);
        } catch (e) {
          // DISPATCH EMAIL WITH ERROR AND USER INFO
          // LOG ERROR
          console.log(e);
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
        console.log(`Unhandled event type ${event.type}`);
    }
    //     // Return a response to acknowledge receipt of the event
    res.status(200).json({ received: true });
  },
};
