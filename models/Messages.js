const { Model, DataTypes } = require('sequelize');
const sequelize = require('../database');

class Messages extends Model {}

Messages.init(
  {
    id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true
    },
    body: {
        type: DataTypes.STRING(1000),
        allowNull: true,
    },
    sendingtime: {
        type: DataTypes.DATE,
        allowNull: true,
        default: DataTypes.NOW
    },
    viewtype: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
  },
  {
    sequelize,
    timestamps: false,
    modelName: 'messages'
  }
);

module.exports = Messages;
