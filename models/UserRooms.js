const { Model, DataTypes } = require('sequelize');
const sequelize = require('../database');

class UserRooms extends Model {}

UserRooms.init(
  {
    isadmin: {
        type: DataTypes.BOOLEAN
    }
  },
  {
    sequelize,
    timestamps: false,
    modelName: 'userrooms'
  }
);

module.exports = UserRooms;
