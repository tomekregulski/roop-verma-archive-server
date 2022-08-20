const router = require('express').Router();
const {
  Track,
  Tape,
  Location,
  Category,
  Raga,
  Artist,
  TrackArtist,
} = require('../models');

router.get('/', async (req, res) => {
  try {
    const allPerformanceTypes = await Category.findAll({
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
      },
    });
    const performanceTypeData = allPerformanceTypes.map((performanceType) =>
      performanceType.get({ plain: true })
    );
    res.status(200).json(performanceTypeData);
  } catch (err) {
    console.log('Performance Type error: ', err);
    res.status(500).json(err);
  }
});

module.exports = router;
