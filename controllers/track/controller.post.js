const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

module.exports = {
  createTrack: async (req, res, next) => {
    try {
      const { trackId, ...rest } = req.body;

      const existingTrack = await prisma.track.findUnique({
        where: { trackId },
      });

      if (existingTrack) {
        const error = new Error(
          `A track with trackId: ${existingTrack.trackId} already exists`
        );
        error.status = 401;
        throw error;
      }

      const newTrack = await prisma.track.create({
        data: { trackId, ...rest },
      });

      res.status(200).json({ data: newTrack });
    } catch (err) {
      next(err);
    }
  },
  trackPlay: async (req, res, next) => {
    try {
      const newTrackPlay = await prisma.trackPlay.create({
        userId: req.body.userId,
        trackId: req.body.trackId,
        secondsListened: req.body.secondsListened,
      });

      res.status(200).json(newTrackPlay);
    } catch (err) {
      next(err);
    }
  },
};
