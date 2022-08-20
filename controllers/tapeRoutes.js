const router = require('express').Router();
const {
  Tape,
  Track,
  Location,
  Raga,
  Category,
  Artist,
  TrackArtist,
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
              model: Category,
              as: 'category',
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
      ],
    });
    const tapeData = allTapes.map((tape) => tape.get({ plain: true }));
    res.status(200).json(tapeData);
  } catch (err) {
    console.log('Tape get error: ', err);
    res.status(500).json(err);
  }
});

module.exports = router;
