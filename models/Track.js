const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/connection');
const { TrackArtists } = require('./TrackArtists');

class Track extends Model {}

Track.init(
  {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
    },
    track_id: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    tape_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'tape',
        key: 'id',
      },
    },
    raag_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'raag',
        key: 'id',
      },
    },
    performance_type_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'performance_type',
        key: 'id',
      },
    },

    url: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  // {
  //   hooks: {
  //     afterCreate: (track) => {
  //       return sequelize.models.TrackArtists.create({
  //         artist_id: track.artist_id,
  //         track_id: track.id,
  //       });
  //     },
  //   },
  // },
  {
    sequelize: sequelize,
    freezeTableName: true,
    underscored: true,
    modelName: 'track',
  }
);

module.exports = Track;
