const { Track } = require('../models');

const trackData = [
  {
    track_id: 00001,
    tape_id: 1,
    location_id: 1,
    raag_id: 1,
    performance_type_id: 1,
  },
  {
    track_id: 00002,
    tape_id: 1,
    location_id: 1,
    raag_id: 2,
    performance_type_id: 1,
  },
  {
    track_id: 00003,
    tape_id: 2,
    location_id: 1,
    raag_id: 1,
    performance_type_id: 2,
  },
  {
    track_id: 00004,
    tape_id: 3,
    location_id: 1,
    raag_id: 3,
    performance_type_id: 3,
  },
];

const seedTracks = () => Track.bulkCreate(trackData);

module.exports = seedTracks;
