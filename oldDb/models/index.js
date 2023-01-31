const Artist = require('./Artist');
const Event = require('./Event');
const Location = require('./Location');
const Category = require('./Category');
const MediaType = require('./MediaType');
const NonMusicalItem = require('./NonMusicalItem');
const Raga = require('./Raga');
const Tape = require('./Tape');
const Track = require('./Track');
const User = require('./User');
const TrackArtist = require('./TrackArtist');
const TrackPlay = require('./TrackPlay');
const TrackUser = require('./TrackUser');

// User.belongsToMany(Track, {
//   through: 'track_play',
// });

// Track.belongsToMany(User, {
//   through: 'track_play',
// });
//
Artist.belongsToMany(Track, {
  through: 'track_artist',
});
//
Track.belongsToMany(Artist, {
  through: 'track_artist',
});

User.belongsToMany(Track, {
  through: 'track_user',
});

Track.belongsToMany(User, {
  through: 'track_user',
});
//
Tape.belongsTo(Event, {
  foreignKey: 'event_id',
});
//
Event.hasMany(Tape, {
  foreignKey: 'event_id',
});

NonMusicalItem.belongsTo(Event, {
  foreignKey: 'event_id',
});

Event.hasMany(NonMusicalItem, {
  foreignKey: 'event_id',
});
//
Track.belongsTo(Tape, {
  foreignKey: 'tape_id',
});
//
Tape.hasMany(Track, {
  foreignKey: 'tape_id',
});
//
Event.belongsTo(Location, {
  foreignKey: 'location_id',
});
//
Location.hasMany(Event, {
  foreignKey: 'location_id',
});
//
Event.belongsTo(Category, {
  foreignKey: 'category_id',
});
//
Category.hasMany(Event, {
  foreignKey: 'category_id',
});
//
Track.belongsTo(MediaType, {
  foreignKey: 'media_type_id',
});
//
MediaType.hasMany(Track, {
  foreignKey: 'media_type_id',
});
//
Track.belongsTo(Raga, {
  foreignKey: 'raga_id',
});
//
Raga.hasMany(Track, {
  foreignKey: 'raga_id',
});

module.exports = {
  Artist,
  Event,
  Location,
  MediaType,
  NonMusicalItem,
  Category,
  Raga,
  Tape,
  Track,
  User,
  TrackArtist,
  TrackUser,
  TrackPlay,
};
