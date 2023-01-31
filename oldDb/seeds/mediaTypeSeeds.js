const { MediaType } = require('../models');

const mediaTypeData = [
  {
    name: 'audio',
  },
  {
    name: 'video',
  },
  {
    name: 'image',
  },
  {
    name: 'text',
  },
];

const seedMediaTypess = () => MediaType.bulkCreate(mediaTypeData);

module.exports = seedMediaTypess;
