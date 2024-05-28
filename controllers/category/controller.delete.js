const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

module.exports = {
  delete: async (req, res, next) => {
    try {
      const { id } = req.body;

      const deletedCategory = await prisma.category.delete({
        where: {
          id,
        },
      });
      res.status(200).json({ data: deletedCategory });
    } catch (err) {
      next(err);
    }
  },
};
