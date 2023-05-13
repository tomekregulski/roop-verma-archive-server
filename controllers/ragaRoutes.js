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
    const allRagas = await Raga.findAll({
      // include: {
      //   model: Track,
      //   as: 'tracks',
      //   include: [
      //     {
      //       model: Tape,
      //       as: 'tape',
      //     },
      //     {
      //       model: Location,
      //       as: 'location',
      //     },
      //     {
      //       model: Category,
      //       as: 'category',
      //     },
      //     {
      //       model: Artist,
      //       as: 'artists',
      //       through: {
      //         model: TrackArtist,
      //       },
      //     },
      //   ],
      // },
    });
    const ragaData = allRagas.map((raga) => raga.get({ plain: true }));
    res.status(200).json(ragaData);
  } catch (err) {
    console.log('Raga get error: ', err);
    res.status(500).json(err);
  }
});

module.exports = router;
