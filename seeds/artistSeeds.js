const { Artist } = require('../models');

const artistData = [
  {
    name: 'Roop Verma',
    instrument: 'Sitar',
  },
  {
    name: 'Narendra Verma',
    instrument: 'Tabla',
  },
  {
    name: 'Kevin West Milburn',
    instrument: 'Tabla',
  },
  {
    name: 'Kamala Vedanthan',
    instrument: 'Tanpura',
  },
  {
    name: 'Ravi Shankar',
    instrument: 'Sitar',
  },
];

const seedArtists = () => Artist.bulkCreate(artistData);

module.exports = seedArtists;
