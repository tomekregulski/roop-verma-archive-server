const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/connection');

class MediaType extends Model {}

MediaType.init(
  {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    sequelize,
    freezeTableName: true,
    underscored: true,
    modelName: 'media_type',
  }
);

module.exports = MediaType;
