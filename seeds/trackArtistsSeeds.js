const { TrackArtists } = require('../models');

const trackArtistsData = [
  {
    track_id: 1,
    artist_id: 1,
  },
  {
    track_id: 1,
    artist_id: 2,
  },
  {
    track_id: 2,
    artist_id: 1,
  },
  {
    track_id: 2,
    artist_id: 2,
  },
  {
    track_id: 3,
    artist_id: 1,
  },
  {
    track_id: 4,
    artist_id: 1,
  },
];

const seedTrackArtists = () => TrackArtists.bulkCreate(trackArtistsData);

module.exports = seedTrackArtists;
