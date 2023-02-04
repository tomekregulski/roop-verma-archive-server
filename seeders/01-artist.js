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
      'Artist',
      [
        {
          name: 'Roop Verma',
        },
        {
          name: 'Narendra Verma',
        },
        {
          name: 'Kevin West Milburn',
        },
        {
          name: 'Kamala Vedanthan',
        },
        {
          name: 'Ravi Shankar',
        },
        {
          name: 'T. Steven Crisman',
        },
        {
          name: 'K. Paramjyoti',
        },
        {
          name: 'Meera',
        },
        {
          name: 'Krishna',
        },
        {
          name: 'Doug Werner',
        },
        {
          name: 'Tripta',
        },
        {
          name: 'Bob Becker',
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
    return queryInterface.bulkDelete('Artists', null, {});
  },
};
