const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

module.exports = {
  update: async (req, res, next) => {
    try {
      const { id, eventName, date, locationId, categoryId, notes } = req.body;

      const updatedEvent = await prisma.event.update({
        where: {
          id,
        },
        data: { eventName, date, locationId, categoryId, notes },
      });

      res.status(200).json({ data: updatedEvent });
    } catch (err) {
      next(err);
    }
  },
};
