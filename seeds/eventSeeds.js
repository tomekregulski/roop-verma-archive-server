const { Event } = require('../models');

const eventData = [
  {
    event_name: '',
    date: '04/04/78',
    location_id: 1,
    category_id: 1,
    notes: '',
  },
  {
    event_name: 'Two Evening Ragas',
    date: '09/01/78',
    location_id: 1,
    category_id: 1,
    notes: '',
  },
  {
    event_name: '',
    date: '05/09/79',
    location_id: 3,
    category_id: 2,
    notes: 'Lesson with Pandit Ravi Shankar',
  },
  {
    event_name: '',
    date: '04/04/79',
    location_id: 4,
    category_id: 1,
    notes: '',
  },
  {
    event_name: '',
    date: '10/30/78',
    location_id: 1,
    category_id: 1,
    notes: 'Kevin West Milburn - Tabla, Kamala Vedanthan - Tanpura',
  },
];

const seedEvents = () => Event.bulkCreate(eventData);

module.exports = seedEvents;
