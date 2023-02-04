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
      'Location',
      [
        {
          name: 'Unknown',
        },
        {
          name: 'Los Angeles, CA',
        },
        {
          name: 'Fort Collins, CO',
        },
        {
          name: 'Boulder Free School',
        },
        {
          name: 'Ananda Ashram',
        },
        {
          name: 'Boulder, CO',
        },
        {
          name: 'Eckerd College',
        },
        {
          name: 'Kripalu Ashram',
        },
        {
          name: 'Montreal, Canada',
        },
        {
          name: 'Rochester, NY',
        },
        {
          name: 'San Francisco - Brahmananda Ashram',
        },
        {
          name: 'Florida, NY',
        },
        {
          name: 'Victoria Museum',
        },
        {
          name: 'Prema',
        },
        {
          name: 'Watson Homestead',
        },
        {
          name: 'Burlington, VT',
        },
        {
          name: 'Yoga Society of Florida',
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
    return queryInterface.bulkDelete('Locations', null, {});
  },
};
