const router = require('express').Router();
const { Track, Tape, Location, PerformanceType, Raag } = require('../models');

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
