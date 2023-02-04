const {
  Track,
  Tape,
  Location,
  Raga,
  Artist,
  TrackArtist,
  Event,
  MediaType,
  Category,
} = require('../../models');

module.exports = {
  allTracks: async (_req, res, next) => {
    try {
      const allTracks = await Track.findAll({
        include: [
          {
            model: Tape,
            as: 'tape',
            include: [
              {
                model: Event,
                as: 'event',
                include: [
                  {
                    model: Location,
                    as: 'location',
                  },
                  {
                    model: Category,
                    as: 'category',
                  },
                ],
              },
            ],
          },
          {
            model: MediaType,
            as: 'media_type',
          },
          {
            model: Raga,
            as: 'raga',
          },
          {
            model: Artist,
            as: 'artists',
            through: {
              model: TrackArtist,
            },
          },
        ],
      });

      const trackData = allTracks.map((track) => track.get({ plain: true }));
      res.status(200).json(trackData);
    } catch (err) {
      next(err);
    }
  },
  publicTracks: async (_req, res, next) => {
    try {
      const allTracks = await Track.findAll({
        include: [
          {
            model: Tape,
            as: 'tape',
            include: [
              {
                model: Event,
                as: 'event',
                include: [
                  {
                    model: Location,
                    as: 'location',
                  },
                ],
              },
            ],
          },
          {
            model: MediaType,
            as: 'media_type',
          },
          {
            model: Raga,
            as: 'raga',
          },
          {
            model: Artist,
            as: 'artists',
            through: {
              model: TrackArtist,
            },
          },
        ],
        where: {
          public: true,
        },
      });

      const trackData = allTracks.map((track) => track.get({ plain: true }));
      res.status(200).json(trackData);
    } catch (err) {
      next(err);
    }
  },
};
