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
    console.log('webhook');
    const event = req.body;
    console.log(event);
    switch (event.type) {
      case 'product.created': {
        console.log('PRODUCT_CREATED');
        const data = event.data.object;
        const requestInfo = event.request;
        const stripeId = data.id;
        console.log(data);
        console.log(requestInfo);
        console.log(stripeId);
      }
      case 'product.updated': {
        console.log('PRODUCT_UPDATED');
        const data = event.data.object;
        const requestInfo = event.request;
        const stripeId = data.id;
        console.log(data);
        console.log(requestInfo);
        console.log(stripeId);
      }
      case 'customer.created': {
        console.log('CUSTOMER_CREATED');
        const data = event.data.object;
        const requestInfo = event.request;
        const stripeId = data.id;
        console.log(data);
        console.log(requestInfo);
        console.log(stripeId);

        const user = {
          email: data.email,
          firstName: 'Tomek',
          lastName: 'Regulski',
          stripeId,
          isAdmin: false,
        };

        await prisma.user.create({
          data: user,
        });

        // console.log(user);
        // console.log(newUser);
        break;
      }
      case 'customer.updated': {
        console.log('CUSTOMER_UPDATED');
        const data = event.data.object;
        const requestInfo = event.request;
        const stripeId = data.id;
        console.log(data);
        console.log(requestInfo);
        console.log(stripeId);
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

        const logData = {
          requestId: requestInfo.id,
          idempotencyKey: requestInfo.idempotency_key,
          type: event.type,
        };
        console.log(logData);

        const logEntry = await prisma.webhookLog.create({
          data: logData,
        });
        console.log(logEntry);
        break;
      }
      case 'payment_method.updated': {
        console.log('PAYMENT_METHOD_UPDATED');
        const data = event.data.object;
        const requestInfo = event.request;
        const stripeId = data.id;
        console.log(data);
        console.log(requestInfo);
        console.log(stripeId);
        break;
      }
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

        // await prisma.subscription.update({
        //   data: subscriptionData,
        // });

        // prisma.user.update({
        //   where: {
        //     stripeId,
        //   },
        //   data: {
        //     subscriptions: [newSubscription],
        //     // TODO: what status levels are available?
        //     subscriptionActive: data.status === 'active',
        //   },
        // });
        break;
      }
      // case 'customer.subscription.paused': {
      //   console.log('SUBSCRIPTION_PAUSED');
      //   const data = event.data.object;
      //   const requestInfo = event.request;
      //   const stripeId = data.id;
      //   console.log(data);
      //   console.log(requestInfo);
      //   console.log(stripeId);
      //   break;
      // }
      // case 'customer.subscription.resumed': {
      //   console.log('SUBSCRIPTION_RESUMED');
      //   const data = event.data.object;
      //   const requestInfo = event.request;
      //   const stripeId = data.id;
      //   console.log(data);
      //   console.log(requestInfo);
      //   console.log(stripeId);
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

        const prismaUser = await prisma.user.findUnique({
          where: {
            stripeId: stripeId,
          },
        });
        console.log(prismaUser);

        const deletedSub = await prisma.subscription.deleteMany({
          where: {
            stripeId: stripeId,
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
