const { Tape } = require('../models');

const tapeData = [
  {
    event_id: 1,
    tape_id: 1,
  },
  {
    event_id: 2,
    tape_id: 2,
  },
  {
    event_id: 3,
    tape_id: 3,
  },
  {
    event_id: 4,
    tape_id: 4,
  },
  {
    event_id: 5,
    tape_id: 5,
  },
];

const seedTapes = () => Tape.bulkCreate(tapeData);

module.exports = seedTapes;
