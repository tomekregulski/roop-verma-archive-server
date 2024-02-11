const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

module.exports = {
  getAll: async (req, res, next) => {
    try {
      const allNetworkErrors = await prisma.networkError.findMany({});
      res.status(200).json(allNetworkErrors);
    } catch (err) {
      next(err);
    }
  },
};
