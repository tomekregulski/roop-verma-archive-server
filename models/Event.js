/*
TODO - Consider the benefits of having a Model at this level
name: YYYY + MM + Location + any other descriptive info
date
location
category????
associated tapes, writings, images, etc

*/

const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/connection');

class Event extends Model {}

Event.init(
  {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
    },
    event_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    date: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    location_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'location',
        key: 'id',
      },
    },
    performance_type_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'performance_type',
        key: 'id',
      },
    },
    notes: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    associated_tapes: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    associated_videos: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    associated_images: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    associated_texts: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    sequelize,
    freezeTableName: true,
    underscored: true,
    modelName: 'event',
  }
);

module.exports = Event;
