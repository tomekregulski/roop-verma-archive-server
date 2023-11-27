const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

module.exports = {
  getAll: async (req, res, next) => {
    try {
      const allRagas = await prisma.raga.findMany({});
      res.status(200).json(allRagas);
    } catch (err) {
      next(err);
    }
  },
};
