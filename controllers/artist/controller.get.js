const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

module.exports = {
  getAll: async (req, res, next) => {
    try {
      const allArtists = await prisma.artist.findMany({});
      res.status(200).json(allArtists);
    } catch (err) {
      next(err);
    }
  },
};
