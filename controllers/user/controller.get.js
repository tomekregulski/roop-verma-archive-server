const { User } = require('../../models');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

module.exports = {
  checkExisting: async (req, res, next) => {
    const { email } = req.params;
    try {
      const existingUser = await prisma.user.findUnique({
        where: {
          email,
        },
      });
      const isExistingUser = existingUser ? true : false;
      res.status(200).json({ isExistingUser });
    } catch (err) {
      next(err);
    }
  },
  getAll: async (req, res, next) => {
    try {
      const user = await prisma.tape.findMany({});
      res.status(200).json({ user });
    } catch (err) {
      next(err);
    }
  },
};
