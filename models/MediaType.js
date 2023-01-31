'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class MediaType extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  MediaType.init(
    {
      name: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: 'MediaType',
    }
  );
  MediaType.associate = function (models) {
    // associations can be defined here
    MediaType.hasMany(models.Track, {
      foreignKey: 'media_type_id',
    });
  };
  return MediaType;
};
