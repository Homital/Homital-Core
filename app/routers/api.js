const express = require('express');
const router = express.Router(); // Not my problem :P

const authRouter = require('./auth');
const userRouter = require('./user');
const deviceRouter = require('./device');

router.use('/auth', authRouter);

router.use('/user', userRouter);

router.use('/device', deviceRouter);

router.get('/', (req, res) => res.redirect(307, 'https://github.com/Homital/Homital-Core/blob/master/README.md'));


module.exports = router;
