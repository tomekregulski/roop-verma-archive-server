const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

module.exports = {
  delete: async (req, res, next) => {
    try {
      const { id } = req.body;

      const deletedEvent = await prisma.event.delete({
        where: {
          id,
        },
      });
      res.status(200).json({ data: deletedEvent });
    } catch (err) {
      next(err);
    }
  },
};
