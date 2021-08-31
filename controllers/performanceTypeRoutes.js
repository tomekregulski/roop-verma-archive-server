const router = require('express').Router();
const { PerformanceType } = require('../models');

router.get('/', async (req, res) => {
  try {
    const allPerformanceTypes = await PerformanceType.findAll();
    const performanceTypeData = allPerformanceTypes.map((performanceType) =>
      performanceType.get({ plain: true })
    );
    res.status(200).json(performanceTypeData);
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
});

module.exports = router;
