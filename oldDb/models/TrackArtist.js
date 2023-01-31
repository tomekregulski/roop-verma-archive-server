const { Model, DataTypes } = require('sequelize');

const sequelize = require('../config/connection');

class TrackArtist extends Model {}

TrackArtist.init(
  {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
    },
    artist_id: {
      type: DataTypes.INTEGER,
      references: {
        model: 'artist',
        key: 'id',
      },
    },
    track_id: {
      type: DataTypes.INTEGER,
      references: {
        model: 'track',
        key: 'id',
      },
    },
  },
  {
    sequelize,
    timestamps: false,
    freezeTableName: true,
    underscored: true,
    modelName: 'track_artist',
  }
);

module.exports = TrackArtist;
