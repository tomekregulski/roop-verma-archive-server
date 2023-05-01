const { TrackPlay } = require('../../models');

const prisma = new PrismaClient();

module.exports = {
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
