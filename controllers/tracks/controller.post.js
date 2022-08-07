const { TrackPlay } = require('../../models');

module.exports = {
  trackPlay: async (req, res) => {
    try {
      const newTrackPlay = await TrackPlay.create({
        user_id: req.body.userId,
        track_id: req.body.trackId,
        seconds_listened: req.body.secondsListened,
      });

      res.status(200).json(newTrackPlay);
    } catch (err) {
      next(err);
    }
  },
};
