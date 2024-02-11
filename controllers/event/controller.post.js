const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

module.exports = {
  create: async (req, res, next) => {
    try {
      const { eventName, date, locationId, categoryId, notes } = req.body;

      const newEvenet = await prisma.event.create({
        data: { eventName, date, locationId, categoryId, notes },
      });

      res.status(200).json({ data: newEvenet });
    } catch (err) {
      next(err);
    }
  },
};
