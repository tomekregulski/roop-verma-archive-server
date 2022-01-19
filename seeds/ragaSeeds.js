const { Raga } = require('../models');

const ragaData = [
  {
    name: 'Bhupali',
  },
  {
    name: 'Madhukauns',
  },
  {
    name: 'Rageshree',
  },
  {
    name: 'Chandrakauns',
  },
  {
    name: 'Nat Bhairav',
  },
  {
    name: 'Manj Khammaj',
  },
  {
    name: 'Hemant',
  },
  {
    name: 'Dhun',
  },
  {
    name: 'Bageshree',
  },
];

const seedRagas = () => Raga.bulkCreate(ragaData);

module.exports = seedRagas;
