const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/connection');

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
    location_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'location',
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
    raag_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'raag',
        key: 'id',
      },
    },
  },
  {
    sequelize,
    freezeTableName: true,
    underscored: true,
    modelName: 'track',
  }
);

module.exports = Track;
