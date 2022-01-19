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
    const allRagas = await Raga.findAll({
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
    const ragaData = allRagas.map((raga) => raga.get({ plain: true }));
    res.status(200).json(ragaData);
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
});

module.exports = router;
