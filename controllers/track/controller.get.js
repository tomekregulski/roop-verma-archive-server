const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

module.exports = {
  allTracks: async (_req, res, next) => {
    try {
      const allTracks = await prisma.track.findMany({
        include: {
          tape: {
            include: {
              event: {
                include: {
                  category: true,
                  location: true,
                },
              },
            },
          },
          mediaType: true,
          raga: true,
          // artist: true // as trackArtist ??
        },
      });

      res.status(200).json(allTracks);
    } catch (err) {
      next(err);
    }
  },
  publicTracks: async (_req, res, next) => {
    try {
      const allTracks = await prisma.track.findMany({
        where: {
          public: true,
        },
        include: {
          tape: {
            include: {
              event: {
                include: {
                  category: true,
                  location: true,
                },
              },
            },
          },
          mediaType: true,
          raga: true,
          // artist: true // as trackArtist ??
        },
      });

      res.status(200).json(allTracks);
    } catch (err) {
      next(err);
    }
  },
};
