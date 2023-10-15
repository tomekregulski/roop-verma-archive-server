const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function getUserByStripeId(stripeId) {
  const user = await prisma.user.findUnique({
    where: {
      stripeId: stripeId,
    },
  });
  return user;
}

module.exports = { getUserByStripeId };
