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
    const allLocations = await Location.findAll({});
    const locationData = allLocations.map((location) =>
      location.get({ plain: true })
    );
    res.status(200).json(locationData);
  } catch (err) {
    res.status(500).json(err);
  }
});

module.exports = router;
