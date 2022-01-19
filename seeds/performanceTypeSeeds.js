const { PerformanceType } = require('../models');

const performanceTypeData = [
  {
    name: 'concert',
  },
  {
    name: 'retreat',
  },
  {
    name: 'discussion',
  },
  {
    name: 'sharing',
  },
  {
    name: 'meditation',
  },
  {
    name: 'guided meditation',
  },
  {
    name: 'interview',
  },
  {
    name: 'lesson',
  },
  {
    name: 'lecture',
  },
  {
    name: 'seminar',
  },
  {
    name: 'course',
  },
  {
    name: 'demo',
  },
  {
    name: 'picture',
  },
  { name: 'essay' },
  { name: 'composition' },
  {
    name: 'class',
  },
];

const seedPerformanceTypes = () =>
  PerformanceType.bulkCreate(performanceTypeData);

module.exports = seedPerformanceTypes;
