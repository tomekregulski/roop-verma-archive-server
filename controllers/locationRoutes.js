const router = require('express').Router();
const {
  Track,
  Tape,
  Location,
  PerformanceType,
  Raga,
  Artist,
  TrackArtists,
} = require('../models');

router.get('/', async (req, res) => {
  try {
    const allLocations = await Location.findAll({
      include: {
        model: Track,
        as: 'tracks',
        include: [
          {
            model: Tape,
            as: 'tape',
          },
          {
            model: PerformanceType,
            as: 'performance_type',
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
      },
    });
    const locationData = allLocations.map((location) =>
      location.get({ plain: true })
    );
    res.status(200).json(locationData);
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
});

module.exports = router;
