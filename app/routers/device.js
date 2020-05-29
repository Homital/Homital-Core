const express = require('express');
const router = express.Router();
const db = require('../db/db');
const utils = require('../utils/utils');

router.use(utils.authenticateDevice);

router.get('/', (req, res) => {
    res.json({success: true, message: "authorized!"});
});

router.get('/status', (req, res) => {
    db.models.Status.findOne({'id': req.deviceid}, (err, status) => {
        if (err) {
            console.error(err);
            res.status(404).json({success: false, error: err.toString()});
        }
        res.json({success: true, status: status});
    });
});

router.get('/:username/:roomname/:devicename', (req, res) => {
    db.models.Status.findOne({'id': 'qwertyuiop'}, 'power', (err, status) => {
        if (err) {
            console.error(err);
            res.status(404).json({success: false, error: err.toString()});
        }
        res.json({success: true, status: {power: status.power}});
    });
});

const updates_router = require('./deviceupdates');

router.use('/updates', updates_router);

module.exports = router;