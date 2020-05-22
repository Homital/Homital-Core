const express = require('express');
const router = express.Router();

const db = require('../db/db');

router.get('/', (req, res) => res.redirect(307, 'https://github.com/Homital/Homital-Core/blob/master/README.md'));

router.get('/users', (req, res) => res.json(["Alice","Bob","Charlie","Dave","Eve"]));

router.get('/users/:username/rooms', (req, res) => res.json(["livingroom", "bedroom", "kitchen"]));

router.get('/users/:username/devices', (req, res) => res.json([{id: "qwertyuiop", name: "lamp", room: "living room"}]));

router.get('/users/:username/:roomname/devices', (req, res) => res.json([{id: "qwertyuiop", name: "lamp", room: "living room"}]));

router.get('/users/:username/:roomname/:devicename', (req, res) => {
    db.models.Status.findOne({'id': 'qwertyuiop'}, 'power', (err, status) => {
        if (err) {
            console.error(err);
            res.status(404).json({success: false, error: err.toString()});
        }
        res.json({success: true, status: status});
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

module.exports = router;