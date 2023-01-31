const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/connection');

class Tape extends Model {}

Tape.init(
  {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
    },
    event_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'event',
        key: 'id',
      },
    },
  },
  {
    sequelize,
    freezeTableName: true,
    underscored: true,
    modelName: 'tape',
  }
);

module.exports = Tape;
