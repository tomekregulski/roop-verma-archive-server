const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

module.exports = {
  TESTING_ONLY_deleteAllUsers: async (req, res, next) => {
    try {
      console.log('attempting delete...');
      await prisma.user.deleteMany({});
      await prisma.subscription.deleteMany({});
      res.status(200).json(`Successfully deleted all users and subscriptions`);
    } catch (err) {
      next(err);
    }
  },
};
