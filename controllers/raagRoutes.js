const router = require('express').Router();
const { Raag } = require('../models');

router.get('/', async (req, res) => {
  try {
    const allRaags = await Raag.findAll();
    const raagData = allRaags.map((raag) => raag.get({ plain: true }));
    res.status(200).json(raagData);
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
});

module.exports = router;
