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
  deleteById: async (req, res, next) => {
    try {
      const { id } = req.query;
      console.log(`Attempting to delete user ${id}`);
      const user = await prisma.user.delete({
        where: { id: parseInt(id) },
      });
      console.log('deleted user:');
      console.log(user);
      res.status(200).json(`deleted user with id: ${id}`);
    } catch (err) {
      next(err);
    }
  },
};
