const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/connection');
const { TrackArtist } = require('./TrackArtist');

class Track extends Model {}

Track.init(
  {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
    },
    tape_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'tape',
        key: 'id',
      },
    },
    raga_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'raga',
        key: 'id',
      },
    },
    primary_artist_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    alap: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
    },
    jor: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
    },
    jhalla: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
    },
    slow_gat: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
    },
    medium_gat: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
    },
    fast_gat: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
    },
    accompanied: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
    },
    notes: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    audio_quality: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    master: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
    },
    media_type_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'media_type',
        key: 'id',
      },
    },
    public: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
    },
    url: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  // {
  //   hooks: {
  //     afterCreate: (track) => {
  //       return sequelize.models.TrackArtists.create({
  //         artist_id: track.artist_id,
  //         track_id: track.id,
  //       });
  //     },
  //   },
  // },
  {
    sequelize: sequelize,
    freezeTableName: true,
    underscored: true,
    modelName: 'track',
  }
);

module.exports = Track;
