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
    const allPerformanceTypes = await PerformanceType.findAll({
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
      },
    });
    const performanceTypeData = allPerformanceTypes.map((performanceType) =>
      performanceType.get({ plain: true })
    );
    res.status(200).json(performanceTypeData);
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
});

module.exports = router;
