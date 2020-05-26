const express = require('express');
const router = express.Router();

const auth_router = require('./auth');
const user_router = require('./user');
const device_router = require('./device');

router.use('/auth', auth_router);

router.use('/user', user_router);

router.use('/device', device_router);

router.get('/', (req, res) => res.redirect(307, 'https://github.com/Homital/Homital-Core/blob/master/README.md'));


module.exports = router;