const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
module.exports = {
  create: async (req, res, next) => {
    try {
      const { name } = req.body;

      const newArtist = await prisma.artist.create({
        data: { name },
      });

      res.status(200).json({ data: newArtist });
    } catch (err) {
      next(err);
    }
  },
};
