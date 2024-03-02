const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

module.exports = {
  delete: async (req, res, next) => {
    try {
      const { id } = req.body;
      const deletedRaga = await prisma.raga.delete({
        where: {
          id,
        },
      });
      res.status(200).json({ data: deletedRaga });
    } catch (err) {
      next(err);
    }
  },
};
