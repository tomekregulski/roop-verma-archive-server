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
  {
    name: 'Lesson',
  },
];

const seedPerformanceTypes = () =>
  PerformanceType.bulkCreate(performanceTypeData);

module.exports = seedPerformanceTypes;
