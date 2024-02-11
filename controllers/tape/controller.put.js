const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

module.exports = {
  update: async (req, res, next) => {
    try {
      const { id, eventId, tapeId } = req.body;

      const updatedTape = await prisma.tape.update({
        where: {
          id,
        },
        data: { eventId, tapeId },
      });

      res.status(200).json({ data: updatedTape });
    } catch (err) {
      next(err);
    }
  },
};
