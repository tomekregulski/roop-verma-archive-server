'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Track extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  Track.init(
    {
      track_id: DataTypes.INTEGER,
      tape_id: DataTypes.INTEGER,
      raga_id: DataTypes.INTEGER,
      primary_artist_id: DataTypes.INTEGER,
      plays: DataTypes.INTEGER,
      alap: DataTypes.BOOLEAN,
      jor: DataTypes.BOOLEAN,
      jhalla: DataTypes.BOOLEAN,
      slow_gat: DataTypes.BOOLEAN,
      medium_gat: DataTypes.BOOLEAN,
      fast_gat: DataTypes.BOOLEAN,
      accompanied: DataTypes.BOOLEAN,
      notes: DataTypes.STRING,
      audio_quality: DataTypes.STRING,
      master: DataTypes.BOOLEAN,
      media_type_id: DataTypes.INTEGER,
      public: DataTypes.BOOLEAN,
      url: DataTypes.STRING,
    },
    {
      sequelize,
      timestamps: true,
      freezeTableName: true,
      underscored: true,
      modelName: 'Track',
    }
  );
  Track.associate = function (models) {
    // associations can be defined here
    Track.belongsToMany(models.Artist, {
      through: 'track_artist',
    });
    Track.belongsTo(models.Tape, {
      foreignKey: 'id',
    });
    Track.belongsTo(models.MediaType, {
      foreignKey: 'id',
    });
    Track.belongsTo(models.Raga, {
      foreignKey: 'id',
    });
    Track.belongsToMany(models.User, {
      through: 'track_play',
    });
  };
  return Track;
};
