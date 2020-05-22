const express = require('express');
const router = express.Router();

router.get('/', (req, res) => res.redirect(307, 'https://github.com/Homital/Homital-Core/blob/master/README.md'));

router.get('/users', (req, res) => res.json(["Alice","Bob","Charlie","Dave","Eve"]));

router.get('/users/:username/rooms', (req, res) => res.json(["livingroom", "bedroom", "kitchen"]));

router.get('/users/:username/devices', (req, res) => res.json([{id: "qwertyuiop", name: "lamp", room: "living room"}]));

router.get('/users/:username/:roomname/devices', (req, res) => res.json([{id: "qwertyuiop", name: "lamp", room: "living room"}]));

router.get('/users/:username/:roomname/:devicename', (req, res) => res.json({power: "on"}));

router.get('/users/:username/:roomname/:devicename/actions', (req, res) => res.json(["poweron", "poweroff"]));

router.post('/users/:username/:roomname/:devicename/:actionname', (req, res) => res.json("Successful"));

module.exports = router;