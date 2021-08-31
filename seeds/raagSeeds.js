const { Raag } = require('../models');

const raagData = [
  {
    name: 'Yaman Kalyan',
  },
  {
    name: 'Megh',
  },
  {
    name: 'Kirwani',
  },
];

const seedRaags = () => Raag.bulkCreate(raagData);

module.exports = seedRaags;
