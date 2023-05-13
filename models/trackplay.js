'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class TrackPlay extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  TrackPlay.init(
    {
      user_id: DataTypes.INTEGER,
      track_id: DataTypes.INTEGER,
      seconds_listened: DataTypes.INTEGER,
    },
    {
      sequelize,
      timestamps: false,
      freezeTableName: true,
      underscored: true,
      modelName: 'TrackPlay',
    }
  );
  return TrackPlay;
};
