const { Raag } = require('../models');

const raagData = [
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

const seedRaags = () => Raag.bulkCreate(raagData);

module.exports = seedRaags;
