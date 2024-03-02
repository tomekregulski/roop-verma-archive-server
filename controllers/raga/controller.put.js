const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

module.exports = {
  update: async (req, res, next) => {
    try {
      const { id, ...rest } = req.body;

      const updatedRaga = await prisma.raga.update({
        where: {
          id,
        },
        data: {
          ...rest,
        },
      });
      res.status(200).json({ data: updatedRaga });
    } catch (err) {
      next(err);
    }
  },
};
