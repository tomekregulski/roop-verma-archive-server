const { Model, DataTypes } = require('sequelize');

const sequelize = require('../config/connection');

class TrackUser extends Model {}

TrackUser.init(
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
  },
  {
    sequelize,
    timestamps: false,
    freezeTableName: true,
    underscored: true,
    modelName: 'track_user',
  }
);

module.exports = TrackUser;
