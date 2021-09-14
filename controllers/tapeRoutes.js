const router = require('express').Router();
const {
  Tape,
  Track,
  Location,
  Raag,
  PerformanceType,
  Artist,
  TrackArtists,
} = require('../models');

router.get('/', async (req, res) => {
  try {
    const allTapes = await Tape.findAll({
      include: [
        {
          model: Track,
          as: 'tracks',
          include: [
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
        },
      ],
    });
    const tapeData = allTapes.map((tape) => tape.get({ plain: true }));
    res.status(200).json(tapeData);
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
});

module.exports = router;
