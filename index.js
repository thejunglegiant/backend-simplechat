const app = require('express')();
const server = require('http').createServer(app);
const io = require('socket.io')(server);
const bodyparser = require('body-parser');
const sequelize = require('./database');
const Users = require('./models/Users');
const UserRooms = require('./models/UserRooms');
const Rooms = require('./models/Rooms');

const PORT = process.env.PORT || 3000;

app.use(bodyparser.urlencoded({extended: true}));
app.use(bodyparser.json());

const router = require('./router');
app.use(router);

const activeUsers = new Map();

io.on('connect', (socket) => {
    let user_id, firstname, lastname = '';

    socket.on('sync', async user => {
        user = await JSON.parse(user);
        user_id = user.id;
        console.log(user);
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
        sequelize.query(`INSERT INTO userrooms (userid, roomid, isadmin) VALUES ('${user_id}', ${currentRoomId}, true)`)
        socket.emit('onNewGroupAdded');
        // Rooms.create({ title: newGroup.title }).then(room => {
        //     UserRooms.create({ userId: user_id, roomId: room.get('id'), isadmin: true }).then(relation => {
        //         socket.emit('onNewGroupAdded');
        //     }).catch(err => { console.error(err) });
        // });
        for (let user of newGroup.users) {
            sequelize.query(`INSERT INTO userrooms (userid, roomid, isadmin) VALUES ('${user.id}', ${currentRoomId}, false)`)
            // UserRooms.create({ userId: user.id, roomId: currentRoomId, isadmin: false});
            if (activeUsers.has(user.id)) {
                activeUsers.get(user.id).join(currentRoomId);
                activeUsers.get(user.id).emit('onNewGroupAdded');
            }
        }
    });

    socket.on('onNewMessageSent', async (newMessage) => {
        const time = new Date().getTime();
        newMessage = await JSON.parse(newMessage);
        sequelize.query('INSERT INTO messages (userid, roomid, body, sendingtime) VALUES (' +
            `'${newMessage.userId}', ${newMessage.roomId}, '${newMessage.body}', current_timestamp)`)
            .catch(err => {
                console.error(err);
            });
        io.in(newMessage.roomId).emit("onNewMessageReceived", {
            roomId: newMessage.roomId,
            firstname,
            body: newMessage.body,
            stime: time,
        });
    });

    socket.on('disconnect', () => {
        sequelize.query(`UPDATE users SET last_session = current_timestamp WHERE id = '${user_id}'`);
        console.log(`user disconnected`);
    });
})

server.listen(PORT, () => {
    console.log(`Server runs on port ${PORT}`);
})