const { Location } = require('../models');

const locationData = [
  {
    name: 'N/A',
  },
  {
    name: 'Ananda Ashram',
  },
  {
    name: 'Los Angeles',
  },
  {
    name: 'Fort Collins, CO',
  },
];

const seedLocations = () => Location.bulkCreate(locationData);

module.exports = seedLocations;
