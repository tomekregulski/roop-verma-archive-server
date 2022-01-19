const seedArtists = require('./artistSeeds');
const seedLocations = require('./locationSeeds');
const seedMediaTypes = require('./mediaTypeSeeds');
const seedPerformanceTypes = require('./performanceTypeSeeds');
const seedRagas = require('./ragaSeeds');
const seedTapes = require('./tapeSeeds');
const seedTracks = require('./trackSeeds');
const seedUsers = require('./userSeeds');
const seedTrackArtists = require('./trackArtistsSeeds');
const seedEvents = require('./eventSeeds');

const sequelize = require('../config/connection');

const seedAll = async () => {
  await sequelize.sync({ force: true });
  console.log('\n----- DATABASE SYNCED -----\n');

  await seedArtists();
  console.log('\n----- ARTISTS SEEDED -----\n');

  await seedLocations();
  console.log('\n----- LOCATIONS SEEDED -----\n');

  await seedPerformanceTypes();
  console.log('\n----- PERFORMANCE TYPES SEEDED -----\n');

  await seedMediaTypes();
  console.log('\n----- MEDIA TYPES SEEDED -----\n');

  await seedRagas();
  console.log('\n----- RAGAS SEEDED -----\n');

  await seedEvents();
  console.log('\n----- EVENTS SEEDED -----\n');

  await seedTapes();
  console.log('\n----- TAPES SEEDED -----\n');

  await seedUsers();
  console.log('\n----- USERS SEEDED -----\n');

  await seedTracks();
  console.log('\n----- TRACKS SEEDED -----\n');

  await seedTrackArtists();
  console.log('\n----- TRACK ARTISTS SEEDED -----\n');

  process.exit(0);
};

seedAll();
