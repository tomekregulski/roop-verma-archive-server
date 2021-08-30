const { Test } = require('../models');

const testData = [
  {
    name: 'Test1',
  },
  {
    name: 'Test2',
  },
  {
    name: 'Test3',
  },
];

const seedTests = () => Test.bulkCreate(testData);

module.exports = seedTests;
