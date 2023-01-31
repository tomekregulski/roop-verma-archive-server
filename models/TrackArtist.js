'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class TrackArtist extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  TrackArtist.init({
    artist_id: DataTypes.INTEGER,
    track_id: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'TrackArtist',
  });
  return TrackArtist;
};