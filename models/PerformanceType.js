const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/connection');

class PerformanceType extends Model {}

PerformanceType.init(
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
    modelName: 'performance_type',
  }
);

module.exports = PerformanceType;
