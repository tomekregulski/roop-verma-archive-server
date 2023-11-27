const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

module.exports = {
  getAll: async (req, res, next) => {
    try {
      const allEvents = await prisma.event.findMany({});
      res.status(200).json(allEvents);
    } catch (err) {
      next(err);
    }
  },
};
