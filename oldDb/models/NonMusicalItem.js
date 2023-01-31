/*
TODO - consider all possibilities under this model. Should this be broken into differnt types?
MediaType
Category
Event Id

Notes
URL
*/
const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/connection');

class NonMusicalItem extends Model {}

NonMusicalItem.init(
  {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
    },
    notes: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    url: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    event_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'event',
        key: 'id',
      },
    },
    media_type_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'media_type',
        key: 'id',
      },
    },
    category_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'category',
        key: 'id',
      },
    },
  },
  {
    sequelize,
    freezeTableName: true,
    underscored: true,
    modelName: 'non_musical_item',
  }
);

module.exports = NonMusicalItem;
