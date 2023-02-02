'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Tape extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  Tape.init(
    {
      tape_id: DataTypes.INTEGER,
      event_id: DataTypes.INTEGER,
    },
    {
      sequelize,
      timestamps: true,
      freezeTableName: true,
      underscored: true,
      modelName: 'Tape',
    }
  );
  Event.associate = function (models) {
    // associations can be defined here
    Tape.belongsTo(models.Event, {
      foreignKey: 'event_id',
    });
    Tape.hasMany(models.Track, {
      foreignKey: 'tape_id',
    });
  };
  return Tape;
};
