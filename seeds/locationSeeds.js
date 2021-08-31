const { Location } = require('../models');

const locationData = [
  {
    name: 'Ananda Ashram',
  },
];

const seedLocations = () => Location.bulkCreate(locationData);

module.exports = seedLocations;
