const { PerformanceType } = require('../models');

const performanceTypeData = [
  {
    name: 'Concert',
  },
  {
    name: 'Naad Yoga Retreat',
  },
  {
    name: 'Meditation',
  },
];

const seedPerformanceTypes = () =>
  PerformanceType.bulkCreate(performanceTypeData);

module.exports = seedPerformanceTypes;
