const router = require('express').Router();
const { Track } = require('../models');

router.get('/', async (req, res) => {
  try {
    const allTracks = await Track.findAll();
    const trackData = allTracks.map((track) => track.get({ plain: true }));
    res.status(200).json(trackData);
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
});

module.exports = router;
