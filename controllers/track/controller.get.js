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
            as: 'Tape',
            // include: [
            //   {
            //     model: Event,
            //     as: 'Event',
            //     include: [
            //       {
            //         model: Location,
            //         as: 'Location',
            //       },
            //       {
            //         model: Category,
            //         as: 'Category',
            //       },
            //     ],
            //   },
            // ],
          },
          {
            model: MediaType,
            as: 'MediaType',
          },
          {
            model: Raga,
            as: 'Raga',
          },
          {
            model: Artist,
            as: 'Artists',
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
            as: 'Tape',
            // include: [
            //   {
            //     model: Event,
            //     as: 'Event',
            //     include: [
            //       {
            //         model: Location,
            //         as: 'Location',
            //       },
            //       {
            //         model: Category,
            //         as: 'Category',
            //       },
            //     ],
            //   },
            // ],
          },
          {
            model: MediaType,
            as: 'MediaType',
          },
          {
            model: Raga,
            as: 'Raga',
          },
          {
            model: Artist,
            as: 'Artists',
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
