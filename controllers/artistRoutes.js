const router = require('express').Router();
const { Artist, Track, TrackArtist } = require('../models');

router.get('/', async (req, res) => {
  try {
    const allArtists = await Artist.findAll({
      include: {
        model: Track,
        through: {
          model: TrackArtist,
        },
      },
    });
    const artistData = allArtists.map((artist) => artist.get({ plain: true }));
    res.status(200).json(artistData);
  } catch (err) {
    console.log('Artists get: ', err);
    res.status(500).json(err);
  }
});

module.exports = router;
