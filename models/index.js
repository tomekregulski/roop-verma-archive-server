const Test = require('./Test');
const Artist = require('./Artist');
const Location = require('./Location');
const PerformanceType = require('./PerformanceType');
const Raag = require('./Raag');
const Tape = require('./Tape');
const Track = require('./Track');
const User = require('./User');

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
  Test,
  Artist,
  Location,
  PerformanceType,
  Raag,
  Tape,
  Track,
  User,
};
