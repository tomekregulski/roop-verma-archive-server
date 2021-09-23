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
];

const seedRaags = () => Raag.bulkCreate(raagData);

module.exports = seedRaags;
