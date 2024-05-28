const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

module.exports = {
  getAll: async (req, res, next) => {
    try {
      const allACategories = await prisma.category.findMany({});
      res.status(200).json(allACategories);
    } catch (err) {
      next(err);
    }
  },
};
