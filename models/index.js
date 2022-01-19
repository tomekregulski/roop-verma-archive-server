const Artist = require('./Artist');
const Event = require('./Event');
const Location = require('./Location');
const PerformanceType = require('./PerformanceType');
const MediaType = require('./MediaType');
const NonMusicalItem = require('./NonMusicalItem');
const Raga = require('./Raga');
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

Tape.belongsTo(Event, {
  foreignKey: 'event_id',
});

Event.hasMany(Tape, {
  foreignKey: 'event_id',
});

NonMusicalItem.belongsTo(Event, {
  foreignKey: 'event_id',
});

Event.hasMany(NonMusicalItem, {
  foreignKey: 'event_id',
});

Track.belongsTo(Tape, {
  foreignKey: 'tape_id',
});

Tape.hasMany(Track, {
  foreignKey: 'tape_id',
});

Event.belongsTo(Location, {
  foreignKey: 'location_id',
});

Location.hasMany(Event, {
  foreignKey: 'location_id',
});

Track.belongsTo(PerformanceType, {
  foreignKey: 'performance_type_id',
});

PerformanceType.hasMany(Track, {
  foreignKey: 'performance_type_id',
});

Track.belongsTo(MediaType, {
  foreignKey: 'performance_type_id',
});

MediaType.hasMany(Track, {
  foreignKey: 'performance_type_id',
});

Track.belongsTo(Raga, {
  foreignKey: 'raga_id',
});

Raga.hasMany(Track, {
  foreignKey: 'raga_id',
});

module.exports = {
  Artist,
  Event,
  Location,
  MediaType,
  NonMusicalItem,
  PerformanceType,
  Raga,
  Tape,
  Track,
  User,
  TrackArtists,
};
