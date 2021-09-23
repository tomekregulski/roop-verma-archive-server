const { Track } = require('../models');

const trackData = [
  {
    track_id: 00001,
    tape_id: 1,
    location_id: 1,
    raag_id: 1,
    performance_type_id: 1,
    url: '/static/media/00001.a3638678.mp3',
  },
  {
    track_id: 00002,
    tape_id: 1,
    location_id: 1,
    raag_id: 2,
    performance_type_id: 1,
    url: '/static/media/00002.d1e348b6.mp3',
  },
  {
    track_id: 00003,
    tape_id: 2,
    location_id: 1,
    raag_id: 3,
    performance_type_id: 1,
    url: '/static/media/00003.54cb7637.mp3',
  },
  {
    track_id: 00004,
    tape_id: 2,
    location_id: 1,
    raag_id: 4,
    performance_type_id: 1,
    url: '/static/media/00004.c2eda1d4.mp3',
  },
];

const seedTracks = () => Track.bulkCreate(trackData);

module.exports = seedTracks;
