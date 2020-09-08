const app = require('express')();
const server = require('http').createServer(app);
const io = require('socket.io')(server);
const bodyparser = require('body-parser');
const sequelize = require('./database');
const Users = require('./models/Users');
const UserRooms = require('./models/UserRooms');
const Rooms = require('./models/Rooms');
const Messages = require('./models/Messages');

const PORT = process.env.PORT || 3000;

app.use(bodyparser.urlencoded({extended: true}));
app.use(bodyparser.json());

const router = require('./router');
const { env } = require('process');
app.use(router);

const activeUsers = new Map();

io.on('connect', (socket) => {
    let user_id, firstname, lastname = '';

    socket.on('sync', async user => {
        user = await JSON.parse(user);
        user_id = user.id;
        activeUsers.set(user.id, socket);
        const currentUser = await Users.findByPk(user.id);
        if (currentUser == null) {
            console.log(user);
            firstname = user.firstname;
            lastname = user.lastname;
            Users.create({ id: user_id, firstname, lastname });
        } else {
            firstname = currentUser.get('firstname');
            lastname = currentUser.get('lastname');

            const availableRooms = (await UserRooms.findAll({
                attributes: ['roomid'],
                where: { 'userid': user.id }
            }));
            for (let room of availableRooms) {
                socket.join(room.get('roomid'));
            }
        }
        socket.emit('synced', { firstname, lastname });
    });

    socket.on("onNewGroupCreated", async newGroup => {
        newGroup = await JSON.parse(newGroup);
        const currentRoomId = (await Rooms.create({ title: newGroup.title })).get('id');
        sequelize.query(`INSERT INTO userrooms (userid, roomid, isadmin) VALUES ('${user_id}', ${currentRoomId}, true)`);
        socket.emit('onNewGroupAdded');
        for (let user of newGroup.users) {
            sequelize.query(`INSERT INTO userrooms (userid, roomid, isadmin) VALUES ('${user.id}', ${currentRoomId}, false)`);
            if (activeUsers.has(user.id)) {
                activeUsers.get(user.id).join(currentRoomId);
                activeUsers.get(user.id).emit('onNewGroupAdded');
            }
        }
    });

    socket.on('onNewMessageSent', async (newMessage) => {
        newMessage = await JSON.parse(newMessage);
        const time = (await sequelize.query('select current_timestamp as time'))[0][0].time;
        sequelize.query('INSERT INTO messages (userid, roomid, body, sendingtime, viewtype) VALUES (' +
            `'${newMessage.userid}', ${newMessage.roomId}, '${newMessage.body}', '${time}', 0)`)
        .catch(err => {
            console.error(err);
        });

        const currentRoom = await Rooms.findByPk(newMessage.roomId);
        const newMessageId = (await Messages.findOne({
            where: {
                userid: newMessage.userid,
                roomid: newMessage.roomId,
                sendingtime: time
            }
        })).get('id');
        console.log('id -======-' + newMessageId);
        io.in(newMessage.roomId).emit('onNewMessageReceived', {
            id: id,
            userId: newMessage.userid,
            roomId: newMessage.roomId,
            roomTitle: currentRoom.get('title'),
            firstname,
            lastname,
            body: newMessage.body,
            stime: time,
            viewtype: 0,
        });
    });

    socket.on('onDeleteMessage', async (arr) => {
        arr = await JSON.parse(arr);
        console.log(arr);
        let ids = [];
        for (let item of arr) {
            ids.push(item.id);
            sequelize.query(`DELETE FROM messages WHERE id = '${item.id}'`)
            .catch(err => {
                console.error(err);
            });
        }

        // const currentRoom = await Rooms.findByPk(arr[0].roomId);
        io.in(arr[0].roomId).emit('onSomeMessagesDeleted', {
            roomId: arr[0].roomId,
            ids
        });
    });

    socket.on('onLeaveGroup', async (newMessage) => {
        newMessage = await JSON.parse(newMessage);
        const time = new Date().getTime();
        await sequelize.query(`DELETE FROM userrooms WHERE userid = '${user_id}' AND roomid = ${newMessage.roomId}`);
        activeUsers.get(user_id).leave(newMessage.roomId);
        socket.emit('onYouLeftGroup');
        
        sequelize.query('INSERT INTO messages (userid, roomid, sendingtime, viewtype) VALUES (' +
        `'${newMessage.userId}', ${newMessage.roomId}, current_timestamp, 1)`)
        .catch(err => {
            console.error(err);
        });
        
        const members = (await sequelize.query(`SELECT COUNT(*) AS members FROM userrooms WHERE roomid = ${newMessage.roomId}`))[0][0].members;
        const currentRoom = await Rooms.findByPk(newMessage.roomId);
        io.in(newMessage.roomId).emit('onSomeoneLeftGroup', {
            roomId: newMessage.roomId,
            roomTitle: currentRoom.get('title'),
            firstname,
            lastname,
            stime: time,
            viewtype: 1,
            members,
        });

        // Delete the group if it is empty
        if (members < 1) {
            sequelize.query(`DELETE FROM rooms WHERE id = ${newMessage.roomId}`);
        }
    });

    socket.on('typing', async (roomId) => {
        socket.to(roomId).emit('onTyping', { firstname, roomId });
    });

    socket.on('disconnect', () => {
        activeUsers.delete(user_id);
        sequelize.query(`UPDATE users SET last_session = current_timestamp WHERE id = '${user_id}'`);
        console.log(`user disconnected`);
    });
});

server.listen(PORT, () => {
    console.log(`Server runs on port ${PORT}`);
});