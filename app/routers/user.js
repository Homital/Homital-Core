const express = require('express');
const router = express.Router();
const db = require('../db/db');
const utils = require('../utils/utils');

router.use(utils.authenticateToken);

router.get('/' , (req, res) => {
    res.json({user: req.user, users: ["Alice","Bob","Charlie","Dave","Eve"]});
});

router.get('/:username/rooms', (req, res) =>
    res.json(["livingroom", "bedroom", "kitchen"])
);

router.get('/:username/devices', (req, res) =>
    res.json([{id: "qwertyuiop", name: "lamp", room: "living room"}])
);

router.get('/:username/:roomname/devices', (req, res) =>
    res.json([{id: "qwertyuiop", name: "lamp", room: "living room"}])
);

router.get('/:username/:roomname/:devicename', (req, res) => {
    db.models.Status.findOne({'id': 'qwertyuiop'}, 'power', (err, status) => {
        if (err) {
            console.error(err);
            res.status(404).json({success: false, error: err.toString()});
        }
        res.json({success: true, status: {power: status.power}});
    });
});

router.get('/:username/:roomname/:devicename/actions', (req, res) => res.json(["poweron", "poweroff"]));

router.post('/:username/:roomname/:devicename/:actionname', (req, res) => {
    if (req.params.actionname === 'poweron') {
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
    } else if (req.params.actionname === 'poweroff') {
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