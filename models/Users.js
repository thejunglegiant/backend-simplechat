const { Model, DataTypes } = require('sequelize');
const sequelize = require('../database');

class Users extends Model {}

Users.init(
  {
    id: {
        type: DataTypes.STRING(28),
        allowNull: false,
        primaryKey: true,
    },
    firstname: {
        type: DataTypes.STRING(28),
        allowNull: false
    },
    lastname: {
        type: DataTypes.STRING(28),
        allowNull: false
    },
    last_session: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    },
  },
  {
    sequelize,
    timestamps: false,
    modelName: 'users'
  }
);

module.exports = Users;
