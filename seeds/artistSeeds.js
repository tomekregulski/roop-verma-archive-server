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
];

const seedArtists = () => Artist.bulkCreate(artistData);

module.exports = seedArtists;
