'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Artist extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  Artist.init(
    {
      name: DataTypes.STRING,
    },
    {
      sequelize,
      timestamps: false,
      freezeTableName: true,
      underscored: true,
      modelName: 'Artist',
    }
  );
  Artist.associate = function (models) {
    // associations can be defined here
    Artist.belongsToMany(models.Track, {
      through: 'track_artist',
    });
  };
  return Artist;
};
