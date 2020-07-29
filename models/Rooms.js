const { Model, DataTypes } = require('sequelize');
const sequelize = require('../database');

class Rooms extends Model {}

Rooms.init(
  {
    id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false
    }
  },
  {
    sequelize,
    timestamps: false,
    modelName: 'rooms'
  }
);

module.exports = Rooms;
