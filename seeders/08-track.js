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
      'Tracks',
      [
        {
          track_id: '1',
          tape_id: '1',
          raga_id: '54',
          primary_artist_id: '1',
          alap: true,
          jor: true,
          jhalla: true,
          slow_gat: false,
          medium_gat: false,
          fast_gat: false,
          accompanied: false,
          audio_quality: 'good',
          master: false,
          media_type_id: '1',
          public: true,
          url: 'https://res.cloudinary.com/intelly/video/upload/v1636225571/music/00001_ag4fgy.mp3',
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
    return queryInterface.bulkDelete('Tracks', null, {});
  },
};
