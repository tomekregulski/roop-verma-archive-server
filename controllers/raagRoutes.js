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
    const allRaags = await Raag.findAll({
      include: {
        model: Track,
        as: 'tracks',
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
            model: Artist,
            as: 'artists',
            through: {
              model: TrackArtists,
            },
          },
        ],
      },
    });
    const raagData = allRaags.map((raag) => raag.get({ plain: true }));
    res.status(200).json(raagData);
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
});

module.exports = router;
