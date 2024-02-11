const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

module.exports = {
  create: async (req, res, next) => {
    try {
      const { tapeId, eventId } = req.body;

      const existingTape = await prisma.tape.findUnique({
        where: { tapeId },
      });

      if (existingTape) {
        const error = new Error(`A tape with tapeId: ${tapeId} already exists`);
        error.status = 401;
        throw error;
      }

      const newTape = await prisma.tape.create({
        data: { tapeId, eventId },
      });

      res.status(200).json({ data: newTape });
    } catch (err) {
      next(err);
    }
  },
};
