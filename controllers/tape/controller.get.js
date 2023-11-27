const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

module.exports = {
  getAll: async (req, res, next) => {
    try {
      const allTapes = await prisma.tape.findMany({});
      res.status(200).json(allTapes);
    } catch (err) {
      next(err);
    }
  },
};
