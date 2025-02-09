const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
module.exports = {
  updateMany: async (req, res, next) => {
    try {
      const date = new Date();
      const iso = date.toISOString();

      const newNetworkError = await prisma.networkError.updateMany({
        data: {
          timestamp: iso,
        },
      });

      res.status(200).json({ data: newNetworkError });
    } catch (err) {
      next(err);
    }
  },
};
