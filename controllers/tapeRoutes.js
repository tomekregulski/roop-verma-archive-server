const router = require('express').Router();
const { Tape } = require('../models');

router.get('/', async (req, res) => {
  try {
    const allTapes = await Tape.findAll();
    const tapeData = allTapes.map((tape) => tape.get({ plain: true }));
    res.status(200).json(tapeData);
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
});

module.exports = router;
