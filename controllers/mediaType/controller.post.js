const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

module.exports = {
  create: async (req, res, next) => {
    try {
      const { name } = req.body;

      const existingLocation = await prisma.mediaType.findUnique({
        where: { name },
      });

      if (existingLocation) {
        const error = new Error('A media type with that name already exists');
        error.status = 401;
        throw error;
      }

      const newMediaType = await prisma.mediaType.create({
        data: { name },
      });

      res.status(200).json({ data: newMediaType });
    } catch (err) {
      next(err);
    }
  },
};
