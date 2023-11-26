const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

module.exports = {
  getAll: async (req, res, next) => {
    try {
      const allLocations = await prisma.location.findMany({});
      res.status(200).json(allLocations);
    } catch (err) {
      next(err);
    }
  },
};
