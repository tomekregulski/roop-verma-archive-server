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
    tape_id: {
      type: DataTypes.STRING,
      allowNull: false,
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
