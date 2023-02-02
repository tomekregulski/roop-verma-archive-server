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
      'Categories',
      [
        {
          name: 'lesson',
        },
        {
          name: 'nada yoga intensive',
        },
        {
          name: 'retreat',
        },
        {
          name: 'sharing',
        },
        {
          name: 'meditation',
        },
        {
          name: 'guided meditation',
        },
        {
          name: 'unknown',
        },
        {
          name: 'interview',
        },
        {
          name: 'lecture',
        },
        {
          name: 'seminar',
        },
        {
          name: 'course',
        },
        {
          name: 'demo',
        },
        {
          name: 'class',
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
    return queryInterface.bulkDelete('Categories', null, {});
  },
};
