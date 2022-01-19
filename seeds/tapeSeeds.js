const { Tape } = require('../models');

const tapeData = [
  {
    event_id: 1,
    tape_id: 0001,
  },
  {
    event_id: 2,
    tape_id: 0002,
  },
  {
    event_id: 3,
    tape_id: 0003,
  },
  {
    event_id: 4,
    tape_id: 0004,
  },
  {
    event_id: 5,
    tape_id: 0005,
  },
];

const seedTapes = () => Tape.bulkCreate(tapeData);

module.exports = seedTapes;
