const router = require('express').Router();
const {
  Track,
  Tape,
  Location,
  PerformanceType,
  Raag,
  Artist,
  TrackArtists,
} = require('../models');

router.get('/', async (req, res) => {
  try {
    const allTracks = await Track.findAll({
      include: [
        {
          model: Tape,
          as: 'tape',
        },
        {
          model: Location,
          as: 'location',
        },
        {
          model: PerformanceType,
          as: 'performance_type',
        },
        {
          model: Raag,
          as: 'raag',
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
