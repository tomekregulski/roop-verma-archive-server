const { User } = require('../../models');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

module.exports = {
  TESTING_ONLY_deleteAllUsers: async (req, res, next) => {
    try {
      console.log('attempting delete...');
      await prisma.user.deleteMany({});
      res.status(200).json(`Successfully deleted all users`);
    } catch (err) {
      next(err);
    }
  },
};
