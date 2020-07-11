const app = require('express')();
const server = require('http').createServer(app);
const io = require('socket.io')(server);
const { Pool } = require('pg');
const bodyparser = require('body-parser');
const settings = require('./settings');

const pool = new Pool({
    user: settings.USER,
    host: settings.URL,
    database: 'SimpleChat',
    password: settings.PASSWORD,
    port: settings.PORT,
});

const PORT = process.env.PORT || 3000;

app.use(bodyparser.urlencoded({extended: true}));
app.use(bodyparser.json());

const router = require('./router');
app.use(router);

io.on('connect', (socket) => {
    let user_id = '';
    let username = '';
    console.log('user connected');
    socket.on('onUidSent', async id => {
        user_id = id;
        username = (await pool.query('SELECT firstname FROM users WHERE id = $1 LIMIT 1', [id])).rows[0].firstname;
        const availableRooms = (await pool.query('SELECT roomid FROM userrooms WHERE userid = $1', [id])).rows;
        for (let room of availableRooms) {
            socket.join(room.roomid);
        }
    });

    socket.on('onNewMessageSent', async (newMessage) => {
        const time = new Date().getTime();
        newMessage = await JSON.parse(newMessage);
        pool.query('insert into messages (userid, roomid, body, sendingtime) values (' +
            '$1, $2, $3, current_timestamp)', [newMessage.userId, newMessage.roomId, newMessage.body]);
        io.in(newMessage.roomId).emit("onNewMessageReceived", {
            roomId: newMessage.roomId,
            firstname: username,
            body: newMessage.body,
            stime: time,
        });
    });

    socket.on('disconnect', () => {
        pool.query('UPDATE users SET last_session = current_timestamp WHERE id = $1', [user_id]);
        console.log(`user disconnected`);
    });
})

server.listen(PORT, () => {
    console.log(`Server runs on port ${PORT}`);
})