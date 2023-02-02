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
      'Tapes',
      [
        {
          tape_id: '1',
          event_id: '1',
        },
        {
          tape_id: '2',
          event_id: '2',
        },
        {
          tape_id: '3',
          event_id: '3',
        },
        {
          tape_id: '4',
          event_id: '4',
        },
        {
          tape_id: '5',
          event_id: '5',
        },
        {
          tape_id: '6',
          event_id: '6',
        },
        {
          tape_id: '7',
          event_id: '7',
        },
        {
          tape_id: '8',
          event_id: '8',
        },
        {
          tape_id: '9',
          event_id: '9',
        },
        {
          tape_id: '10',
          event_id: '10',
        },
        {
          tape_id: '11',
          event_id: '11',
        },
        {
          tape_id: '12',
          event_id: '12',
        },
        {
          tape_id: '13',
          event_id: '13',
        },
        {
          tape_id: '14',
          event_id: '14',
        },
        {
          tape_id: '15',
          event_id: '15',
        },
        {
          tape_id: '16',
          event_id: '16',
        },
        {
          tape_id: '17',
          event_id: '17',
        },
        {
          tape_id: '18',
          event_id: '18',
        },
        {
          tape_id: '19',
          event_id: '19',
        },
        {
          tape_id: '20',
          event_id: '20',
        },
        {
          tape_id: '21',
          event_id: '21',
        },
        {
          tape_id: '22',
          event_id: '22',
        },
        {
          tape_id: '23',
          event_id: '23',
        },
        {
          tape_id: '24',
          event_id: '24',
        },
        {
          tape_id: '25',
          event_id: '25',
        },
        {
          tape_id: '26',
          event_id: '26',
        },
        {
          tape_id: '27',
          event_id: '27',
        },
        {
          tape_id: '28',
          event_id: '28',
        },
        {
          tape_id: '29',
          event_id: '29',
        },
        {
          tape_id: '30',
          event_id: '30',
        },
        {
          tape_id: '31',
          event_id: '31',
        },
        {
          tape_id: '32',
          event_id: '32',
        },
        {
          tape_id: '33',
          event_id: '33',
        },
        {
          tape_id: '34',
          event_id: '34',
        },
        {
          tape_id: '35',
          event_id: '35',
        },
        {
          tape_id: '36',
          event_id: '36',
        },
        {
          tape_id: '37',
          event_id: '37',
        },
        {
          tape_id: '38',
          event_id: '38',
        },
        {
          tape_id: '39',
          event_id: '39',
        },
        {
          tape_id: '40',
          event_id: '40',
        },
        {
          tape_id: '41',
          event_id: '41',
        },
        {
          tape_id: '42',
          event_id: '42',
        },
        {
          tape_id: '43',
          event_id: '43',
        },
        {
          tape_id: '44',
          event_id: '44',
        },
        {
          tape_id: '45',
          event_id: '45',
        },
        {
          tape_id: '46',
          event_id: '46',
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
    return queryInterface.bulkDelete('Tapes', null, {});
  },
};
