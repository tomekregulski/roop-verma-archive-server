const router = require('express').Router();
const { Test } = require('../models');

router.get('/', async (req, res) => {
  try {
    const allTests = await Test.findAll();
    const testData = allTests.map((test) => test.get({ plain: true }));
    res.status(200).json(testData);
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
});

router.post('/', (req, res) => {
  console.log('success post');
  res.send('success post');
});

module.exports = router;
