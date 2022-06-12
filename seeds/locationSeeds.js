const { Location } = require('../models');

const locationData = [
  {
    name: 'Unknown',
  },
  {
    name: 'Los Angeles, CA',
  },
  {
    name: 'Fort Collins, CO',
  },
  {
    name: 'Boulder Free School',
  },
  {
    name: 'Ananda Ashram',
  },
  {
    name: 'Boulder, CO',
  },
  {
    name: 'Eckerd College',
  },
  {
    name: 'Kripalu Ashram',
  },
  {
    name: 'Montreal, Canada',
  },
  {
    name: 'Rochester, NY',
  },
  {
    name: 'San Francisco - Brahmananda Ashram',
  },
  {
    name: 'Florida, NY',
  },
  {
    name: 'Victoria Museum',
  },
  {
    name: 'Prema',
  },
  {
    name: 'Watson Homestead',
  },
  {
    name: 'Burlington, VT',
  },
  {
    name: 'Yoga Society of Florida',
  },
];

const seedLocations = () => Location.bulkCreate(locationData);

module.exports = seedLocations;
