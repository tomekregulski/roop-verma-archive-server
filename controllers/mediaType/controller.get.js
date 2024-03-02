const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

module.exports = {
  getAll: async (req, res, next) => {
    try {
      const allMediaTypes = await prisma.mediaType.findMany({});
      res.status(200).json(allMediaTypes);
    } catch (err) {
      next(err);
    }
  },
};
