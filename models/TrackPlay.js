const { Model, DataTypes } = require('sequelize');

const sequelize = require('../config/connection');

class TrackPlay extends Model {}

TrackPlay.init(
  {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      references: {
        model: 'user',
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
    seconds_listened: {
      type: DataTypes.INTEGER,
    },
  },
  {
    sequelize,
    timestamps: true,
    freezeTableName: true,
    underscored: true,
    modelName: 'track_play',
  }
);

module.exports = TrackPlay;
