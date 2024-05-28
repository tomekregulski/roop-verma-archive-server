const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
module.exports = {
  create: async (req, res, next) => {
    try {
      const { name } = req.body;

      const existingCategory = await prisma.artist.findUnique({
        where: { name },
      });

      if (existingCategory) {
        const error = new Error('An artist with that name already exists');
        error.status = 401;
        throw error;
      }

      const newACategory = await prisma.category.create({
        data: { name },
      });

      res.status(200).json({ data: newACategory });
    } catch (err) {
      next(err);
    }
  },
};
