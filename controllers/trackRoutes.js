const router = require('express').Router();
const {
  Track,
  Tape,
  Location,
  PerformanceType,
  Raga,
  Artist,
  TrackArtists,
  Event,
  MediaType,
} = require('../models');

router.get('/', async (req, res) => {
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
          model: PerformanceType,
          as: 'performance_type',
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
            model: TrackArtists,
          },
        },
      ],
    });
    const trackData = allTracks.map((track) => track.get({ plain: true }));
    res.status(200).json(trackData);
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
});

module.exports = router;
