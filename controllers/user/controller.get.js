const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

module.exports = {
  checkExisting: async (req, res, next) => {
    const { stripeId } = req.query;
    // console.log(req);
    console.log(stripeId);
    try {
      const existingUser = await prisma.user.findUnique({
        where: {
          stripeId: stripeId,
        },
      });
      console.log(existingUser);

      const existingSubscription = await prisma.subscription.findMany({
        where: {
          stripeId: stripeId,
        },
      });
      console.log(existingSubscription);

      res.status(200).json({ existingUser, existingSubscription });
    } catch (err) {
      next(err);
    }
  },
  getAll: async (req, res, next) => {
    try {
      const user = await prisma.user.findMany({});
      res.status(200).json({ user });
    } catch (err) {
      next(err);
    }
  },
};
