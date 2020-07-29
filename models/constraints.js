const Users = require('./Users');
const Rooms = require('./Rooms');
const UserRooms = require('./UserRooms');
const Messages = require('./Messages');

Rooms.belongsToMany(Users, { foreignKey: { name: 'roomid', allowNull: false }, through: UserRooms });
Users.belongsToMany(Rooms, { foreignKey: { name: 'userid', allowNull: false }, through: UserRooms });
Rooms.belongsToMany(Users, { foreignKey: { name: 'roomid', allowNull: false }, through: { model: Messages, unique: false } });
Users.belongsToMany(Rooms, { foreignKey: { name: 'userid', allowNull: false }, through: { model: Messages, unique: false } });
// sequelize.sync();
