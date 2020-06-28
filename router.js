const express = require('express');
const router = express.Router();
const { Pool } = require('pg');

const pool = new Pool({
    user: 'TheJungleGiant',
    host: 'localhost',
    database: 'SimpleChat',
    password: 'alex55',
    port: 5432,
  });

router.get('/', (req, res) => {
    res.send('Server works');
});

router.post('/register', async (req, res) => {
    const user = req.body;
    console.log(user);
    const check = await pool.query('SELECT * FROM users WHERE id = $1', [user.userid]);
    if (check.rowCount < 1) {
        pool.query('INSERT INTO users (userId, firstname, lastname, last_session) VALUES ($1, $2, $3, current_timestamp)',
            [user.userid, user.firstname, user.lastname]);
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
            'SELECT rooms.title, users.firstname, messages.body AS last_message, MAX(messages.sendingtime) AS stime ' +
            'FROM userrooms ' +
            'LEFT JOIN rooms ON rooms.id = userrooms.roomid ' +
            'LEFT JOIN messages ON messages.roomid = userrooms.roomid ' +
            'LEFT JOIN users ON users.id = messages.userid ' +
            'WHERE rooms.title IS NOT NULL AND userrooms.userid = $1 ' +
            'GROUP BY 1,2,3 ' +
            'ORDER BY stime', [req.params.userId]);
        res.status(200).json(availableRooms.rows);
    } else {
        res.status(400);
    }
});

module.exports = router;
