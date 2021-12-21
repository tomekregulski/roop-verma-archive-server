const { Track } = require('../models');

const trackData = [
  {
    track_id: 00001,
    tape_id: 1,
    raag_id: 1,
    performance_type_id: 1,
    url: 'https://res.cloudinary.com/intelly/video/upload/v1636225571/music/00001_ag4fgy.mp3',
  },
  {
    track_id: 00002,
    tape_id: 1,
    raag_id: 2,
    performance_type_id: 1,
    url: 'https://res.cloudinary.com/intelly/video/upload/v1640045222/music/00002_blpoqs.mp3',
  },
  {
    track_id: 00003,
    tape_id: 2,
    raag_id: 3,
    performance_type_id: 1,
    url: 'https://res.cloudinary.com/intelly/video/upload/v1640045635/music/00003_xo50fm.mp3',
  },
  {
    track_id: 00004,
    tape_id: 2,
    raag_id: 4,
    performance_type_id: 1,
    url: 'https://res.cloudinary.com/intelly/video/upload/v1640045878/music/00004_qs35fm.mp3',
  },
  // {
  //   track_id: 00005,
  //   tape_id: 3,
  //   raag_id: 5,
  //   performance_type_id: 2,
  //   url: '/static/media/00005.a9f0fd86.mp3',
  // },
  // {
  //   track_id: 00006,
  //   tape_id: 3,
  //   raag_id: 5,
  //   performance_type_id: 2,
  //   url: '/static/media/00006.c814dfcf.mp3',
  // },
  {
    track_id: 00007,
    tape_id: 4,
    raag_id: 6,
    performance_type_id: 1,
    url: 'https://res.cloudinary.com/intelly/video/upload/v1640045617/music/00007_nsjnnz.mp3'
  {
    track_id: 00008,
    tape_id: 4,
    raag_id: 7,
    performance_type_id: 1,
    url: 'https://res.cloudinary.com/intelly/video/upload/v1640045655/music/00008_iw2lzk.mp3',
  },
  {
    track_id: 00009,
    tape_id: 5,
    raag_id: 2,
    performance_type_id: 1,
    url: 'https://res.cloudinary.com/intelly/video/upload/v1640045668/music/00009_zjkdbp.mp3',
  },
  {
    track_id: 00010,
    tape_id: 5,
    raag_id: 8,
    performance_type_id: 1,
    url: 'https://res.cloudinary.com/intelly/video/upload/v1640045578/music/00010_xwelro.mp3',
  },
  {
    track_id: 00011,
    tape_id: 5,
    raag_id: 9,
    performance_type_id: 1,
    url: 'https://res.cloudinary.com/intelly/video/upload/v1640045634/music/00011_tqcvvh.mp3',
  },
  {
    track_id: 00012,
    tape_id: 5,
    raag_id: 8,
    performance_type_id: 1,
    url: 'https://res.cloudinary.com/intelly/video/upload/v1640045538/music/00012_jbbnm4.mp3',
  },
  {
    track_id: 00013,
    tape_id: 5,
    raag_id: 8,
    performance_type_id: 1,
    url: 'https://res.cloudinary.com/intelly/video/upload/v1640045547/music/00013_zaersn.mp3',
  },
];

const seedTracks = () => Track.bulkCreate(trackData);

module.exports = seedTracks;
