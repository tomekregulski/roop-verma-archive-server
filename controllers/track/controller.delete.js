const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

module.exports = {
  delete: async (req, res, next) => {
    try {
      const { id } = req.body;

      const deleteTrack = await prisma.track.delete({
        where: {
          id,
        },
      });
      res.status(200).json({ data: deleteTrack });
    } catch (err) {
      next(err);
    }
  },
};
