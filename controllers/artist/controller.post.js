const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
module.exports = {
  create: async (req, res, next) => {
    try {
      const { name } = req.body;

      const existingArtist = await prisma.artist.findUnique({
        where: { name },
      });

      if (existingArtist) {
        const error = new Error('An artist with that name already exists');
        error.status = 401;
        throw error;
      }

      const newArtist = await prisma.artist.create({
        data: { name },
      });

      res.status(200).json({ data: newArtist });
    } catch (err) {
      next(err);
    }
  },
};
