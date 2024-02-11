const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

module.exports = {
  delete: async (req, res, next) => {
    try {
      const { id } = req.body;

      const deletedArtist = await prisma.artist.delete({
        where: {
          id,
        },
      });
      console.log(deletedArtist);
      res.status(200).json({ data: deletedArtist });
    } catch (err) {
      next(err);
    }
  },
};
