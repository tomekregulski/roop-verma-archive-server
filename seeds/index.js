// const seedUsers = require('./userSeeds');
// const seedTracks = require('./trackSeeds');
// const seedTapes = require('./tapeSeeds');
// const seedArtists = require('./artistSeeds');
// const seedVenues = require('./venueSeeds');

const seedTests = require('./testSeeds');

const sequelize = require('../config/connection');

const seedAll = async () => {
  await sequelize.sync({ force: true });
  console.log('\n----- DATABASE SYNCED -----\n');

  await seedTests();
  console.log('\n----- TESTS SEEDED -----\n');

  process.exit(0);
};

seedAll();
