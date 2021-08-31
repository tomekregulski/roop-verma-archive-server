const router = require('express').Router();
const { Artist } = require('../models');

router.get('/', async (req, res) => {
  try {
    const allArtists = await Artist.findAll();
    const artistData = allArtists.map((artist) => artist.get({ plain: true }));
    res.status(200).json(artistData);
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
});

module.exports = router;
