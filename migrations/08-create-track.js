'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Tracks', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      track_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      tape_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Tapes',
          key: 'id',
        },
      },
      raga_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Ragas',
          key: 'id',
        },
      },
      primary_artist_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      plays: {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: 0,
      },
      alap: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
      },
      jor: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
      },
      jhalla: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
      },
      slow_gat: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
      },
      medium_gat: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
      },
      fast_gat: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
      },
      accompanied: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
      },
      notes: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      audio_quality: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      master: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
      },
      media_type_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'MediaTypes',
          key: 'id',
        },
      },
      public: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
      },
      url: {
        type: Sequelize.STRING,
        allowNull: false,
      },
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Tracks');
  },
};
