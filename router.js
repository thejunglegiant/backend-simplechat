const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
const settings = require('./settings');

const pool = new Pool({
    user: settings.USER,
    host: settings.URL,
    database: 'SimpleChat',
    password: settings.PASSWORD,
    port: settings.PORT,
});

router.get('/', (req, res) => {
    res.send('Server works');
});

router.post('/register', async (req, res) => {
    const user = req.body;
    const check = await pool.query('SELECT * FROM users WHERE id = $1', [user.id]);
    if (check.rowCount < 1) {
        pool.query('INSERT INTO users (id, firstname, lastname, last_session) VALUES ($1, $2, $3, current_timestamp)',
            [user.id, user.firstname, user.lastname]);
        res.status(201).json(user);
    } else {
        res.status(200).json(check.rows[0]);
    }
});

router.get('/:userId/getUsers', async (req, res) => {
    const check = await pool.query('SELECT * FROM users WHERE id = $1', [req.params.userId]);
    if (check.rowCount > 0) {
        const availableUsers = await pool.query('SELECT * FROM users WHERE id != $1 ORDER BY last_session DESC', [req.params.userId]);
        res.status(200).json(availableUsers.rows);
    } else {
        res.status(400);
    }
});

router.post('/:userId/createGroup', async (req, res) => {
    const room = req.body;
    const check = await pool.query('SELECT * FROM users WHERE id = $1', [req.params.userId]);
    if (check.rowCount > 0) {
        await pool.query('INSERT INTO rooms (title) VALUES ($1)', [room.title]);
        const roomId = (await pool.query('SELECT id FROM rooms ORDER BY id DESC')).rows[0].id;
        pool.query('INSERT INTO userrooms (userId, roomId, isAdmin) VALUES ($1, $2, $3)', [req.params.userId, roomId, true]);
        for (let user of room.users) {
            pool.query('INSERT INTO userrooms (userId, roomId, isAdmin) VALUES ($1, $2, $3)', [user.id, roomId, false]);
        }
        res.status(200).json(room);
    } else {
        res.status(400);
    }
});

router.get('/:userId/getRooms', async (req, res) => {
    const check = await pool.query('SELECT * FROM users WHERE id = $1', [req.params.userId]);
    if (check.rowCount > 0) {
        const availableRooms = await pool.query(
            'SELECT rooms.id, rooms.title, users.firstname, messages.body AS last_message, messages.sendingtime AS stime ' +
            'FROM userrooms ' +
            'LEFT JOIN rooms ON rooms.id = userrooms.roomid ' +
            'LEFT JOIN (SELECT roomid, MAX(sendingtime) AS lastmess ' +
            'FROM messages ' +
            'GROUP BY 1) AS mess ON mess.roomid = userrooms.roomid ' +
            'LEFT JOIN messages ON mess.lastmess = messages.sendingtime ' +
            'LEFT JOIN users ON users.id = messages.userid ' +
            'WHERE rooms.title IS NOT NULL AND userrooms.userid = $1 ' +
            'ORDER BY stime DESC NULLS LAST', [req.params.userId]);
        res.status(200).json(availableRooms.rows);
    } else {
        res.status(400);
    }
});

router.get('/:userId/:roomId/getMessages', async (req, res) => {
    const check = await pool.query('SELECT * FROM users WHERE id = $1', [req.params.userId]);
    if (check.rowCount > 0) {
        const messages = await pool.query(
            'SELECT (users.id = $1) as issender, users.firstname, users.lastname, messages.body, messages.sendingtime AS stime ' +
            'FROM messages ' +
            'LEFT JOIN users ON users.id = messages.userid ' +
            'WHERE messages.roomid = $2 ' +
            'ORDER BY stime', [req.params.userId, req.params.roomId]);
        res.status(200).json(messages.rows);
    } else {
        res.status(400);
    }
});

module.exports = router;
