const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

module.exports = {
  getAll: async (req, res, next) => {
    try {
      const allTributes = await prisma.tribute.findMany({});
      res.status(200).json(allTributes);
    } catch (err) {
      next(err);
    }
  },
};
