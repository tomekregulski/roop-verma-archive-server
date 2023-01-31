const { Artist } = require('../models');

const artistData = [
  {
    name: 'Roop Verma',
  },
  {
    name: 'Narendra Verma',
  },
  {
    name: 'Kevin West Milburn',
  },
  {
    name: 'Kamala Vedanthan',
  },
  {
    name: 'Ravi Shankar',
  },
  {
    name: 'T. Steven Crisman',
  },
  {
    name: 'K. Paramjyoti',
  },
  {
    name: 'Meera',
  },
  {
    name: 'Krishna',
  },
  {
    name: 'Doug Werner',
  },
  {
    name: 'Tripta',
  },
  {
    name: 'Bob Becker',
  },
];

const seedArtists = () => Artist.bulkCreate(artistData);

module.exports = seedArtists;
