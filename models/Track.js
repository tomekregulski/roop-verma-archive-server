const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/connection');
const { TrackArtists } = require('./TrackArtists');

class Track extends Model {}

Track.init(
  {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
    },
    track_id: {
      type: DataTypes.STRING,
      allowNull: false,
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
    other_artist_ids: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    time_of_day: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    alap: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
    },
    jor: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
    },
    jhalla: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
    },
    slow_gat: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
    },
    medium_gat: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
    },
    fast_gat: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
    },
    accompanied: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
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
      allowNull: true,
    },
    media_type_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'media_type',
        key: 'id',
      },
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
