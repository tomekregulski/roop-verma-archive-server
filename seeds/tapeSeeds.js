const { Tape } = require('../models');

const tapeData = [
  {
    tape_id: 0001,
    date: '04/04/78',
    location_id: 1,
    title: 'N/A',
  },
  {
    tape_id: 0002,
    date: '09/01/78',
    location_id: 1,
    title: 'Two Evening Ragas',
  },
  {
    tape_id: 0003,
    date: '05/09/79',
    location_id: 3,
    title: 'N/A',
  },
  {
    tape_id: 0004,
    date: '04/04/79',
    location_id: 4,
    title: 'N/A',
  },
  {
    tape_id: 0005,
    date: '10/30/78',
    location_id: 1,
    title: 'N/A',
  },
];

const seedTapes = () => Tape.bulkCreate(tapeData);

module.exports = seedTapes;
