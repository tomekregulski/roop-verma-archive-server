const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/connection');

class Raga extends Model {}

Raga.init(
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
    alternate_spelling_a: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    alternate_spelling_b: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    time: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    light: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    rasa: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    sequelize,
    freezeTableName: true,
    underscored: true,
    modelName: 'raga',
  }
);

module.exports = Raga;
