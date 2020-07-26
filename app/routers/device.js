const express = require('express');
// eslint-disable-next-line new-cap
const router = express.Router(); // Not my problem :P
const db = require('../db/db');

/**
 * to be changed to jwt
 * maybe the middleware can be returned by another function
 * for more detailed authorization
 * or append the device's props to request object
 * @param {Request} req - request
 * @param {Response} res - response
 * @param {RequestHandler} next - next middleware to be called // import type!
 */
function authenticateDevice(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (token === null) {
    res.sendStatus(401);
    return;
  }
  if (token === 'homital') {
    req.devicetoken = 'homital';
    next();
    return;
  } else {
    res.status(403).json({
      success: false, error: 'authentication token not recognized',
    },
    );
    return;
  }
}

router.use(authenticateDevice);

router.get('/', (req, res) => {
  if (req.devicetoken) {
    res.json('authorized!');
  } else {
    res.status(403).json({error: 'unauthorized!'});
  }
});

router.get('/status', async (req, res) => {
  const roomId = req.query.uid;
  const deviceName = req.query.devicename;
  try {
    const statusObj = await db.functions.getDeviceStatus(roomId, deviceName);
    res.json(statusObj);
  } catch (error) {
    res.status(500).json({
      error: error.toString(),
    });
  }
});

router.get('/roomid', async (req, res) => {
  const userName = req.query.username;
  const roomName = req.query.roomname;
  try {
    const roomId = await db.functions.getRoomId(userName, roomName);
    res.json({uid: roomId});
  } catch (error) {
    res.status(500).json({
      error: error.toString(),
    });
  }
});

const updatesRouter = require('./deviceupdates');

router.use('/updates', updatesRouter);

module.exports = router;
