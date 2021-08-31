const seedArtists = require('./artistSeeds');
const seedLocations = require('./locationSeeds');
const seedPerformanceTypes = require('./performanceTypeSeeds');
const seedRaags = require('./raagSeeds');
const seedTapes = require('./tapeSeeds');
const seedTracks = require('./trackSeeds');
const seedUsers = require('./userSeeds');

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

  await seedRaags();
  console.log('\n----- RAAGS SEEDED -----\n');

  await seedTapes();
  console.log('\n----- TAPES SEEDED -----\n');

  await seedTracks();
  console.log('\n----- TRACKS SEEDED -----\n');

  await seedUsers();
  console.log('\n----- USERS SEEDED -----\n');

  process.exit(0);
};

seedAll();
