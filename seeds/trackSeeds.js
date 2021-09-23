const { Track } = require('../models');

const trackData = [
  {
    track_id: 00001,
    tape_id: 1,
    raag_id: 1,
    performance_type_id: 1,
    url: '/static/media/00001.a3638678.mp3',
  },
  {
    track_id: 00002,
    tape_id: 1,
    raag_id: 2,
    performance_type_id: 1,
    url: '/static/media/00002.d1e348b6.mp3',
  },
  {
    track_id: 00003,
    tape_id: 2,
    raag_id: 3,
    performance_type_id: 1,
    url: '/static/media/00003.54cb7637.mp3',
  },
  {
    track_id: 00004,
    tape_id: 2,
    raag_id: 4,
    performance_type_id: 1,
    url: '/static/media/00004.c2eda1d4.mp3',
  },
  {
    track_id: 00005,
    tape_id: 3,
    raag_id: 5,
    performance_type_id: 2,
    url: '/static/media/00005.a9f0fd86.mp3',
  },
  {
    track_id: 00006,
    tape_id: 3,
    raag_id: 5,
    performance_type_id: 2,
    url: '/static/media/00006.c814dfcf.mp3',
  },
  {
    track_id: 00007,
    tape_id: 4,
    raag_id: 6,
    performance_type_id: 1,
    url: '/static/media/00007.21ab6e70.mp3',
  },
  {
    track_id: 00008,
    tape_id: 4,
    raag_id: 7,
    performance_type_id: 1,
    url: '/static/media/00008.c5172531.mp3',
  },
  {
    track_id: 00009,
    tape_id: 5,
    raag_id: 2,
    performance_type_id: 1,
    url: '/static/media/00009.1e6776e9.mp3',
  },
  {
    track_id: 00010,
    tape_id: 5,
    raag_id: 8,
    performance_type_id: 1,
    url: '/static/media/00010.e56e05ec.mp3',
  },
  {
    track_id: 00011,
    tape_id: 5,
    raag_id: 9,
    performance_type_id: 1,
    url: '/static/media/00011.10d9bfa6.mp3',
  },
  {
    track_id: 00012,
    tape_id: 5,
    raag_id: 8,
    performance_type_id: 1,
    url: '/static/media/00012.cdd2e758.mp3',
  },
  {
    track_id: 00013,
    tape_id: 5,
    raag_id: 8,
    performance_type_id: 1,
    url: '/static/media/00013.0136b522.mp3',
  },
];

const seedTracks = () => Track.bulkCreate(trackData);

module.exports = seedTracks;
