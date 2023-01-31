'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Raga extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  Raga.init(
    {
      name: DataTypes.STRING,
      alternate_spelling: DataTypes.STRING,
      time: DataTypes.STRING,
      rasa: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: 'Raga',
    }
  );
  Raga.associate = function (models) {
    // associations can be defined here
    Raga.hasMany(models.Track, {
      foreignKey: 'raga_id',
    });
  };
  return Raga;
};
