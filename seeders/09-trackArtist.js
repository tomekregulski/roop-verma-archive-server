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
      'TrackArtists',
      [
        {
          artist_id: '4',
          track_id: '14',
        },
        {
          artist_id: '4',
          track_id: '15',
        },
        {
          artist_id: '4',
          track_id: '16',
        },
        {
          artist_id: '6',
          track_id: '14',
        },
        {
          artist_id: '6',
          track_id: '15',
        },
        {
          artist_id: '6',
          track_id: '16',
        },
        {
          artist_id: '7',
          track_id: '17',
        },
        {
          artist_id: '7',
          track_id: '18',
        },
        {
          artist_id: '8',
          track_id: '17',
        },
        {
          artist_id: '8',
          track_id: '18',
        },
        {
          artist_id: '9',
          track_id: '17',
        },
        {
          artist_id: '9',
          track_id: '18',
        },
        {
          artist_id: '10',
          track_id: '25',
        },
        {
          artist_id: '10',
          track_id: '26',
        },
        {
          artist_id: '3',
          track_id: '30',
        },
        {
          artist_id: '3',
          track_id: '31',
        },
        {
          artist_id: '3',
          track_id: '32',
        },
        {
          artist_id: '3',
          track_id: '33',
        },
        {
          artist_id: '7',
          track_id: '39',
        },
        {
          artist_id: '7',
          track_id: '40',
        },
        {
          artist_id: '3',
          track_id: '41',
        },
        {
          artist_id: '3',
          track_id: '42',
        },
        {
          artist_id: '7',
          track_id: '43',
        },
        {
          artist_id: '1',
          track_id: '44',
        },
        {
          artist_id: '7',
          track_id: '45',
        },
        {
          artist_id: '7',
          track_id: '46',
        },
        {
          artist_id: '7',
          track_id: '62',
        },
        {
          artist_id: '7',
          track_id: '63',
        },
        {
          artist_id: '4',
          track_id: '66',
        },
        {
          artist_id: '4',
          track_id: '67',
        },
        {
          artist_id: '11',
          track_id: '73',
        },
        {
          artist_id: '11',
          track_id: '74',
        },
        // {
        //   artist_id: '4',
        //   track_id: '75',
        // },
        // {
        //   artist_id: '4',
        //   track_id: '76',
        // },
        {
          artist_id: '4',
          track_id: '73',
        },
        {
          artist_id: '4',
          track_id: '74',
        },
        // {
        //   artist_id: '8',
        //   track_id: '75',
        // },
        // {
        //   artist_id: '8',
        //   track_id: '76',
        // },
        // {
        //   artist_id: '8',
        //   track_id: '77',
        // },
        // {
        //   artist_id: '9',
        //   track_id: '75',
        // },
        // {
        //   artist_id: '9',
        //   track_id: '76',
        // },
        // {
        //   artist_id: '9',
        //   track_id: '77',
        // },
        // {
        //   artist_id: '7',
        //   track_id: '76',
        // },
        // {
        //   artist_id: '7',
        //   track_id: '77',
        // },
        // {
        //   artist_id: '7',
        //   track_id: '84',
        // },
        // {
        //   artist_id: '7',
        //   track_id: '86',
        // },
        // {
        //   artist_id: '1',
        //   track_id: '87',
        // },
        // {
        //   artist_id: '12',
        //   track_id: '93',
        // },
        // {
        //   artist_id: '12',
        //   track_id: '94',
        // },
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
  },
};
