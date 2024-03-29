const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

module.exports = {
  delete: async (req, res, next) => {
    try {
      const { id } = req.body;
      const deletedLocation = await prisma.location.delete({
        where: {
          id,
        },
      });
      res.status(200).json({ data: deletedLocation });
    } catch (err) {
      next(err);
    }
  },
};
