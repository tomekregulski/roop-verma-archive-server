const Artist = require('./Artist');
const Location = require('./Location');
const PerformanceType = require('./PerformanceType');
const Raag = require('./Raag');
const Tape = require('./Tape');
const Track = require('./Track');
const User = require('./User');
const TrackArtists = require('./TrackArtists');

// Artist.belongsToMany(Track, {
//   through: 'ArtistTracks',
// });

Artist.belongsToMany(Track, {
  through: 'TrackArtists',
});

Track.belongsToMany(Artist, {
  through: 'TrackArtists',
});

// Track.belongsToMany(Artist, {
//   through: 'TrackArtists',
//   foreignKey: 'artist_id',
// });

// Track.belongsToMany(Artist, {
//   through: 'ArtistTracks',
//   as: 'artists',
//   foreignKey: 'track_id',
//   otherKey: 'artist_id',
// });

// Track.hasMany(Artist, {
//   as: 'artists',
//   foreignKey: 'artist_id',
// });

Track.belongsTo(Tape, {
  foreignKey: 'tape_id',
});

Tape.hasMany(Track, {
  foreignKey: 'tape_id',
});

Track.belongsTo(Location, {
  foreignKey: 'location_id',
});

Location.hasMany(Track, {
  foreignKey: 'location_id',
});

Track.belongsTo(PerformanceType, {
  foreignKey: 'performance_type_id',
});

PerformanceType.hasMany(Track, {
  foreignKey: 'performance_type_id',
});

Track.belongsTo(Raag, {
  foreignKey: 'raag_id',
});

Raag.hasMany(Track, {
  foreignKey: 'raag_id',
});

module.exports = {
  Artist,
  Location,
  PerformanceType,
  Raag,
  Tape,
  Track,
  User,
  TrackArtists,
};
