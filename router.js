const express = require('express');
const router = express.Router();
const sequelize = require('./database');
const Users = require('./models/Users');

router.get('/', async (_, res) => {
    // console.log(typeof (await sequelize.query('select current_timestamp as time'))[0][0].time);
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
            'SELECT rooms.id, rooms.title, users.firstname, users.lastname, ' +
            'messages.body AS last_message, messages.sendingtime AS stime, messages.viewtype AS message_viewtype ' +
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

router.get('/:userId/:roomId/getExactRoom', async (req, res) => {
    const currentUser = await Users.findByPk(req.params.userId);
    if (currentUser != null) {
        const messages = await sequelize.query(
            `SELECT (users.id = '${req.params.userId}') as issender, messages.userid, users.firstname, users.lastname, ` +
            'messages.id, messages.body, messages.sendingtime AS stime, messages.viewtype ' +
            'FROM messages ' +
            'LEFT JOIN users ON users.id = messages.userid ' +
            `WHERE messages.roomid = '${req.params.roomId}' ` +
            'ORDER BY stime');
        const members = (await sequelize.query(`SELECT COUNT(*) AS members FROM userrooms WHERE roomid = ${req.params.roomId}`))[0][0].members;
        res.status(200).json({ members, messages: messages[0] });
    } else {
        res.status(400);
    }
});

module.exports = router;
