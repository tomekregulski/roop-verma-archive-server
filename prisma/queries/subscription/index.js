const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function getSubscriptionByStripeId(stripeId) {
  const subscription = await prisma.subscription.findMany({
    where: {
      stripeId: stripeId,
    },
  });
  return subscription;
}

module.exports = { getSubscriptionByStripeId };
