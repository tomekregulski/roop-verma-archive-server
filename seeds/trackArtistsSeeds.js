const { TrackArtists } = require('../models');

const trackArtistsData = [
  {
    track_id: 1,
    artist_id: 1,
  },
  {
    track_id: 2,
    artist_id: 1,
  },

  {
    track_id: 3,
    artist_id: 1,
  },
  {
    track_id: 4,
    artist_id: 1,
  },
  {
    track_id: 5,
    artist_id: 1,
  },
  {
    track_id: 6,
    artist_id: 1,
  },
  {
    track_id: 7,
    artist_id: 1,
  },
  {
    track_id: 8,
    artist_id: 1,
  },
  {
    track_id: 9,
    artist_id: 1,
  },
  {
    track_id: 9,
    artist_id: 3,
  },
  {
    track_id: 9,
    artist_id: 4,
  },
  {
    track_id: 10,
    artist_id: 1,
  },
  {
    track_id: 10,
    artist_id: 3,
  },
  {
    track_id: 10,
    artist_id: 4,
  },
  {
    track_id: 11,
    artist_id: 1,
  },
  {
    track_id: 11,
    artist_id: 3,
  },
  {
    track_id: 11,
    artist_id: 4,
  },
  {
    track_id: 12,
    artist_id: 1,
  },
  {
    track_id: 12,
    artist_id: 3,
  },
  {
    track_id: 12,
    artist_id: 4,
  },
  {
    track_id: 13,
    artist_id: 1,
  },
  {
    track_id: 13,
    artist_id: 3,
  },
  {
    track_id: 13,
    artist_id: 4,
  },
];

const seedTrackArtists = () => TrackArtists.bulkCreate(trackArtistsData);

module.exports = seedTrackArtists;
