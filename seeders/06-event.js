'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    /**
     * Add seed commands here.
     *
     * Example:
     * await queryInterface.bulkInsert('People', [{
     *   name: 'John Doe',
     *   isBetaMember: false
     * }], {});
     */
    await queryInterface.bulkInsert(
      'Event',
      [
        {
          event_name: 'n/a',
          date: '4/4/78',
          location_id: '1',
          category_id: '1',
          notes: 'n/a',
        },
        {
          event_name: 'Two Evening Ragas',
          date: 'Sep-78',
          location_id: '1',
          category_id: '1',
          notes: 'n/a',
        },
        {
          event_name: 'n/a',
          date: '5/9/79',
          location_id: '2',
          category_id: '2',
          notes: 'Lesson with Pandit Ravi Shankar',
        },
        {
          event_name: 'n/a',
          date: '4/4/78',
          location_id: '3',
          category_id: '1',
          notes: 'n/a',
        },
        {
          event_name: 'n/a',
          date: '10/30/78',
          location_id: '1',
          category_id: '1',
          notes: 'Kevin West Milburn - Tabla\r\nKamala Vedanthan - Tanpura',
        },
        {
          event_name: 'n/a',
          date: '10/28/78',
          location_id: '4',
          category_id: '1',
          notes: 'Kevin West Milburn - tabla\r\nT. Steven Crisman - tanpura',
        },
        {
          event_name: 'n/a',
          date: '12/30/78',
          location_id: '5',
          category_id: '1',
          notes: 'n/a',
        },
        {
          event_name: 'n/a',
          date: '09/--/80',
          location_id: '6',
          category_id: '8',
          notes: 'n/a',
        },
        {
          event_name: 'n/a',
          date: 'Oct-77',
          location_id: '5',
          category_id: '8',
          notes: 'performed on Swar Mandala',
        },
        {
          event_name: 'n/a',
          date: '4/8/78',
          location_id: '1',
          category_id: '1',
          notes: 'n/a',
        },
        {
          event_name: 'n/a',
          date: '10/30/77',
          location_id: '7',
          category_id: '1',
          notes: 'n/a',
        },
        {
          event_name: 'n/a',
          date: '4/--/78',
          location_id: '3',
          category_id: '1',
          notes: 'n/a',
        },
        {
          event_name: 'n/a',
          date: '--/--/1977',
          location_id: '8',
          category_id: '8',
          notes: 'n/a',
        },
        {
          event_name: 'n/a',
          date: '10/6/79',
          location_id: '9',
          category_id: '1',
          notes: 'n/a',
        },
        {
          event_name: 'n/a',
          date: 'n/a',
          location_id: '5',
          category_id: '1',
          notes: 'n/a',
        },
        {
          event_name: 'n/a',
          date: '--/--/1977',
          location_id: '5',
          category_id: '1',
          notes: 'n/a',
        },
        {
          event_name: 'n/a',
          date: '5/26/79',
          location_id: '1',
          category_id: '1',
          notes: 'n/a',
        },
        {
          event_name: 'n/a',
          date: '6/2/79',
          location_id: '5',
          category_id: '1',
          notes: 'n/a',
        },
        {
          event_name: 'n/a',
          date: '1/27/79',
          location_id: '10',
          category_id: '1',
          notes: 'n/a',
        },
        {
          event_name: 'n/a',
          date: 'n/a',
          location_id: '1',
          category_id: '8',
          notes: 'n/a',
        },
        {
          event_name: 'n/a',
          date: '0/13/77',
          location_id: '5',
          category_id: '8',
          notes: 'n/a',
        },
        {
          event_name: 'n/a',
          date: 'n/a',
          location_id: '5',
          category_id: '6',
          notes: 'n/a',
        },
        {
          event_name: 'n/a',
          date: '2/25/78',
          location_id: '11',
          category_id: '8',
          notes: 'n/a',
        },
        {
          event_name: 'n/a',
          date: '10/20/79',
          location_id: '12',
          category_id: '6',
          notes: 'n/a',
        },
        {
          event_name: '"Meditation on Sound" Distributed by Ananda Ashram',
          date: '10/20/79',
          location_id: '5',
          category_id: '6',
          notes: 'n/a',
        },
        {
          event_name: 'n/a',
          date: '5/26/78',
          location_id: '5',
          category_id: '1',
          notes: 'n/a',
        },
        {
          event_name: 'n/a',
          date: '08/--/78',
          location_id: '5',
          category_id: '3',
          notes: 'n/a',
        },
        {
          event_name: 'n/a',
          date: '11/15/75',
          location_id: '13',
          category_id: '1',
          notes: 'n/a',
        },
        {
          event_name: 'n/a',
          date: 'n/a',
          location_id: '1',
          category_id: '1',
          notes: 'n/a',
        },
        {
          event_name: 'Music Festival of India',
          date: '11/8/78',
          location_id: '14',
          category_id: '1',
          notes: 'n/a',
        },
        {
          event_name: 'n/a',
          date: '9/2/79',
          location_id: '1',
          category_id: '1',
          notes: 'n/a',
        },
        {
          event_name: 'n/a',
          date: '6/28/79',
          location_id: '15',
          category_id: '1',
          notes: 'n/a',
        },
        {
          event_name: '1st concert (perhaps re: Tripta?)',
          date: '7/30/78',
          location_id: '16',
          category_id: '1',
          notes: 'n/a',
        },
        {
          event_name: 'n/a',
          date: '12/30/78',
          location_id: '1',
          category_id: '1',
          notes: 'n/a',
        },
        {
          event_name: 'n/a',
          date: '2/25/78',
          location_id: '11',
          category_id: '1',
          notes: 'n/a',
        },
        {
          event_name: 'n/a',
          date: '12/--/77',
          location_id: '5',
          category_id: '1',
          notes: 'n/a',
        },
        {
          event_name: 'n/a',
          date: '10/20/78',
          location_id: '5',
          category_id: '4',
          notes: 'n/a',
        },
        {
          event_name: 'n/a',
          date: '01/--/79',
          location_id: '10',
          category_id: '1',
          notes: 'n/a',
        },
        {
          event_name: 'n/a',
          date: '10/6/79',
          location_id: '9',
          category_id: '1',
          notes: 'n/a',
        },
        {
          event_name: 'n/a',
          date: '4/8/78',
          location_id: '3',
          category_id: '1',
          notes: 'n/a',
        },
        {
          event_name: 'Meditation on Sound',
          date: 'n/a',
          location_id: '1',
          category_id: '1',
          notes: 'n/a',
        },
        {
          event_name: 'n/a',
          date: '6/21/78',
          location_id: '10',
          category_id: '3',
          notes: 'n/a',
        },
        {
          event_name: 'n/a',
          date: '1/6/78',
          location_id: '1',
          category_id: '3',
          notes: 'n/a',
        },
        {
          event_name: 'n/a',
          date: '1/27/78',
          location_id: '1',
          category_id: '3',
          notes: 'n/a',
        },
        {
          event_name: 'n/a',
          date: '01/--/78',
          location_id: '1',
          category_id: '3',
          notes: 'n/a',
        },
        {
          event_name: 'n/a',
          date: '10/28/77',
          location_id: '17',
          category_id: '1',
          notes: 'n/a',
        },
      ],
      {}
    );
  },

  async down(queryInterface, Sequelize) {
    /**
     * Add commands to revert seed here.
     *
     * Example:
     * await queryInterface.bulkDelete('People', null, {});
     */
    return queryInterface.bulkDelete('Events', null, {});
  },
};
