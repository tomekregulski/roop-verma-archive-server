const { Event } = require('../models');

const eventData = [
  {
    event_name: 'event name',
    date: '04/04/78',
    location_id: 1,
    performance_type_id: 1,
    associated_tapes: '[0001]',
  },
  {
    event_name: 'Two Evening Ragas',
    date: '09/01/78',
    location_id: 1,
    performance_type_id: 1,
    associated_tapes: '[0002]',
  },
  {
    event_name: 'event name',
    location_id: 3,
    performance_type_id: 1,
    associated_tapes: '[0003]',
    date: '05/09/79',
  },
  {
    event_name: 'event name',
    date: '04/04/79',
    location_id: 4,
    performance_type_id: 1,
    associated_tapes: '[0004]',
  },
  {
    event_name: 'event name',
    date: '10/30/78',
    location_id: 1,
    performance_type_id: 1,
    associated_tapes: '[0005]',
  },
];

const seedEvents = () => Event.bulkCreate(eventData);

module.exports = seedEvents;
