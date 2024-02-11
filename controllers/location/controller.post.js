const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

module.exports = {
  create: async (req, res, next) => {
    try {
      const { name } = req.body;

      const existingLocation = await prisma.location.findUnique({
        where: { name },
      });

      if (existingLocation) {
        const error = new Error('A location with that name already exists');
        error.status = 401;
        throw error;
      }

      const newLocation = await prisma.location.create({
        data: { name },
      });

      res.status(200).json({ data: newLocation });
    } catch (err) {
      next(err);
    }
  },
};
