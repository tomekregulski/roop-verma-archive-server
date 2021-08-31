const { Track } = require('../models');

const trackData = [
  {
    track_id: 00001,
  },
  {
    track_id: 00002,
  },
  {
    track_id: 00003,
  },
];

const seedTracks = () => Track.bulkCreate(trackData);

module.exports = seedTracks;
