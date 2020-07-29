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
    // userid: {
    //     type: DataTypes.STRING(28),
    //     references: {
    //         model: Users,
    //         key: 'id',
    //     }
    // },
    // roomid: {
    //     type: DataTypes.INTEGER,
    //     references: {
    //         model: Rooms,
    //         key: 'id'
    //     }
    // },
    body: {
        type: DataTypes.STRING(1000),
        allowNull: false
    },
    sendingtime: {
        type: DataTypes.DATE,
        allowNull: false,
        default: DataTypes.NOW
    },
  },
  {
    sequelize,
    timestamps: false,
    modelName: 'messages'
  }
);

module.exports = Messages;
