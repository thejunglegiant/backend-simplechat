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
    let socketId = '';
    console.log(`user connected`);
    // socket.on('register', (str) => {
    //     console.log(str);
    // });
    socket.emit('register', "sdf");

    socket.on('verify_user', async (id) => {
        console.log(id)
        const res = await pool.query('SELECT * FROM users WHERE userId = $1', [id]);
        if (res.rowCount < 1) {
            io.to(socket).emit('register');
        }
        socketId = id;
        console.log(res.rows);
    });



    socket.on('disconnect', () => {
        pool.query('UPDATE users SET last_session = current_timestamp WHERE id = $1', [socketId]);
        console.log(`user disconnected`);
    });
})

server.listen(PORT, () => {
    console.log(`Server runs on port ${PORT}`);
})