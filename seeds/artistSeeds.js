const { Artist } = require('../models');

const artistData = [
  {
    name: 'Roop Verma',
  },
  {
    name: 'Narendra Verma',
  },
];

const seedArtists = () => Artist.bulkCreate(artistData);

module.exports = seedArtists;
