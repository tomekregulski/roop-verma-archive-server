const { Tape } = require('../models');

const tapeData = [
  {
    tape_id: 0001,
  },
  {
    tape_id: 0002,
  },
  {
    tape_id: 0003,
  },
];

const seedTapes = () => Tape.bulkCreate(tapeData);

module.exports = seedTapes;
