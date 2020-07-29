const express = require('express');
const router = express.Router();
const sequelize = require('./database');
const Users = require('./models/Users');

router.get('/', (_, res) => {
    res.send('Server works');
});

router.get('/:userId/getUsers', async (req, res) => {
    const currentUser = await Users.findByPk(req.params.userId);
    if (currentUser != null) {
        const availableUsers = await sequelize.query(`SELECT * FROM users WHERE id != '${req.params.userId}' ORDER BY last_session DESC`);
        res.status(200).json(availableUsers[0]);
    } else {
        res.status(400);
    }
});

router.get('/:userId/getRooms', async (req, res) => {
    const currentUser = await Users.findByPk(req.params.userId);
    if (currentUser != null) {
        const availableRooms = await sequelize.query(
            'SELECT rooms.id, rooms.title, users.firstname, messages.body AS last_message, messages.sendingtime AS stime ' +
            'FROM userrooms ' +
            'LEFT JOIN rooms ON rooms.id = userrooms.roomid ' +
            'LEFT JOIN (SELECT roomid, MAX(sendingtime) AS lastmess ' +
            'FROM messages ' +
            'GROUP BY 1) AS mess ON mess.roomid = userrooms.roomid ' +
            'LEFT JOIN messages ON mess.lastmess = messages.sendingtime ' +
            'LEFT JOIN users ON users.id = messages.userid ' +
            `WHERE rooms.title IS NOT NULL AND userrooms.userid = '${req.params.userId}' ` +
            'ORDER BY stime DESC NULLS LAST');
        res.status(200).json(availableRooms[0]);
    } else {
        res.status(400);
    }
});

router.get('/:userId/:roomId/getMessages', async (req, res) => {
    const currentUser = await Users.findByPk(req.params.userId);
    if (currentUser != null) {
        const messages = await sequelize.query(
            `SELECT (users.id = '${req.params.userId}') as issender, users.firstname, users.lastname, messages.body, messages.sendingtime AS stime ` +
            'FROM messages ' +
            'LEFT JOIN users ON users.id = messages.userid ' +
            `WHERE messages.roomid = '${req.params.roomId}' ` +
            'ORDER BY stime');
        res.status(200).json(messages[0]);
    } else {
        res.status(400);
    }
});

module.exports = router;
