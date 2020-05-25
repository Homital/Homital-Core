const express = require('express');
const router = express.Router();
const db = require('../db/db');
const jwt = require('jsonwebtoken');

const auth_router = require('./auth');

router.use('/auth', auth_router);

router.get('/', (req, res) => res.redirect(307, 'https://github.com/Homital/Homital-Core/blob/master/README.md'));

router.get('/users', authenticateToken , (req, res) => {
    res.json({user: req.user, users: ["Alice","Bob","Charlie","Dave","Eve"]});
});

router.get('/users/:username/rooms', (req, res) =>
    res.json(["livingroom", "bedroom", "kitchen"])
);

router.get('/users/:username/devices', (req, res) =>
    res.json([{id: "qwertyuiop", name: "lamp", room: "living room"}])
);

router.get('/users/:username/:roomname/devices', (req, res) =>
    res.json([{id: "qwertyuiop", name: "lamp", room: "living room"}])
);

router.get('/users/:username/:roomname/:devicename', (req, res) => {
    db.models.Status.findOne({'id': 'qwertyuiop'}, 'power', (err, status) => {
        if (err) {
            console.error(err);
            res.status(404).json({success: false, error: err.toString()});
        }
        res.json({success: true, status: {power: status.power}});
    });
});

router.get('/users/:username/:roomname/:devicename/actions', (req, res) => res.json(["poweron", "poweroff"]));

router.post('/users/:username/:roomname/:devicename/:actionname', (req, res) => {
    if (req.params.actionname == 'poweron') {
        db.models.Status.findOne({'id': 'qwertyuiop'}, 'power', (err, status) => {
            if (err) {
                console.error(err);
                res.status(404).json({success: false, error: err.toString()});
            } 
            status.power = true;
            status.save(error => {
                if (error) {
                    console.error(error);
                    res.status(404).json({success: false, error: error.toString()});
                }
                res.json({success: true});
            });
        });
    } else if (req.params.actionname == 'poweroff') {
        db.models.Status.findOne({'id': 'qwertyuiop'}, 'power', (err, status) => {
            if (err) {
                console.error(err);
                res.status(404).json({success: false, error: err.toString()});
            } 
            status.power = false;
            status.save(error => {
                if (error) {
                    console.error(error);
                    res.status(404).json({success: false, error: error.toString()});
                }
                res.json({success: true});
            });
        });
    }
});

function authenticateToken (req, res, next) {
    const auth_header = req.headers['authorization'];
    const token = auth_header && auth_header.split(' ')[1];
    if (token == null) {
        return res.sendStatus(401);
    }
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
        if (err) {
            return res.sendStatus(403);
        }
        req.user = user;
        next();
    })
}

module.exports = router;