const express = require('express');
// eslint-disable-next-line new-cap
const router = express.Router(); // Not my problem :P
const db = require('../db/db');
const utils = require('../utils/utils');

router.use(utils.authenticateToken);

router.get('/rooms', async (req, res) => {
  const username = req.user.username;
  try {
    const rooms = await db.functions.getRooms(username);
    res.json(rooms);
  } catch (error) {
    res.status(500).json({
      error: error.toString(),
    });
    return;
  }
});

router.post('/rooms', async (req, res) => {
  const username = req.user.username;
  const roomName = req.body.name;
  try {
    const roomId = await db.functions.createRoom(username, roomName);
    console.log(`Hahaha: rid: ${roomId}`);
    res.json({
      room_id: roomId,
    });
    return;
  } catch (error) {
    res.status(500).json({
      error: error.toString(),
    });
  }
});

router.delete('/rooms', async (req, res) => {
  const username = req.user.username;
  const roomId = req.query.uid;
  try {
    await db.functions.deleteRoom(username, roomId);
    res.json('success');
    return;
  } catch (error) {
    res.status(500).json({
      error: error.toString(),
    });
  }
});

router.put('/rooms', async (req, res) => {
  const username = req.user.username;
  const roomId = req.query.uid;
  const newName = req.body.name;
  try {
    await db.functions.updateRoom(username, roomId, newName);
    res.json('success');
    return;
  } catch (error) {
    res.status(500).json({
      error: error.toString(),
    });
  }
});

router.get('/rooms/members', async (req, res) => {
  const username = req.user.username;
  const roomId = req.query.uid;
  try {
    const members = await db.functions.getRoomMembers(username, roomId);
    res.json(members);
    return;
  } catch (error) {
    res.status(500).json({
      error: error.toString(),
    });
  }
});

router.post('/rooms/members', async (req, res) => {
  const username = req.user.username;
  const roomId = req.query.uid;
  const newUSer = req.body;
  const roomName = req.body.name;
  try {
    if (await db.functions.memberExists(newUSer.username, roomId)) {
      res.status(409).json({
        error: 'member exists',
      });
      return;
    }
    if (!await db.functions.getUserByUsername(newUSer.username)) {
      res.status(404).json({
        error: 'user not found',
      });
      return;
    }
    const opst = await db.functions.addRoomMember(
        username, roomId, newUSer.username, newUSer.role, roomName,
    );
    if (opst === 1) {
      res.status(403).json({
        error: 'Not authorized',
      });
      return;
    } else if (opst === 2) {
      res.status(500).json({
        error: 'Internal server error',
      });
      return;
    } else if (opst === 0) {
      res.json('success');
      return;
    }
  } catch (error) {
    res.status(500).json({
      error: error.toString(),
    });
  }
});

router.put('/rooms/members', async (req, res) => {
  const username = req.user.username;
  const roomId = req.query.uid;
  const theUser = req.body;
  try {
    if (!await db.functions.isPrivileged(username, roomId)) {
      res.status(403).json({
        error: 'Not authorized',
      });
      return;
    }
    await db.functions.updateRoomMember(
        username, roomId, theUser.username, theUser.role,
    );
    res.json('success');
    return;
  } catch (error) {
    res.status(500).json({
      error: error.toString(),
    });
  }
});

router.delete('/rooms/members', async (req, res) => {
  const username = req.user.username;
  const roomId = req.query.uid;
  const usernameTBD = req.query.username;
  try {
    if (!await db.functions.isPrivileged(username, roomId)) {
      res.status(403).json({
        error: 'Not authorized',
      });
      return;
    }
    await db.functions.deleteRoomMember(username, roomId, usernameTBD);
    res.json('success');
    return;
  } catch (error) {
    res.status(500).json({
      error: error.toString(),
    });
  }
});

router.get('/rooms/devices', async (req, res) => {
  const username = req.user.username;
  const roomId = req.query.uid;
  try {
    const devices = await db.functions.getRoomDevices(username, roomId);
    res.json(devices);
    return;
  } catch (error) {
    res.status(500).json({
      error: error.toString(),
    });
  }
});

router.post('/rooms/devices', async (req, res) => {
  const username = req.user.username;
  const roomId = req.query.uid;
  const deviceType = req.body.type;
  const deviceName = req.body.name;
  if (!['homital-light', 'homital-usb-adapter'].includes(deviceType)) {
    res.status(406).json({
      error: 'device not supported',
    });
    return;
  }
  try {
    const opst = await db.functions.addRoomDevice(
        username, roomId, deviceType, deviceName,
    );
    if (opst === 1) {
      res.status(403).json({
        error: 'Not authorized',
      });
      return;
    } else if (opst === 2) {
      res.status(500).json({
        error: 'Internal server error',
      });
      return;
    } else if (opst === 0) {
      res.json('success');
      return;
    }
  } catch (error) {
    res.status(500).json({
      error: error.toString(),
    });
  }
});

router.put('/rooms/devices', async (req, res) => {
  const username = req.user.username;
  const roomId = req.query.uid;
  const oldName = req.body.old_name;
  const newName = req.body.new_name;
  try {
    if (!await db.functions.isPrivileged(username, roomId)) {
      res.status(403).json({
        error: 'Not authorized',
      });
      return;
    }
    await db.functions.updateRoomDevice(
        username, roomId, oldName, newName,
    );
    res.json('success');
    return;
  } catch (error) {
    res.status(500).json({
      error: error.toString(),
    });
  }
});

router.delete('/rooms/devices', async (req, res) => {
  const username = req.user.username;
  const roomId = req.query.uid;
  const deviceName = req.query.devicename;
  try {
    await db.functions.removeRoomDevice(username, roomId, deviceName);
    res.json('success');
    return;
  } catch (error) {
    res.status(500).json({
      error: error.toString(),
    });
  }
});

router.get('/rooms/devices/operations', async (req, res) => {
  /*
  const username = req.user.username;
  const roomId = req.query.uid;
  const deviceName = req.query.devicename;
  */
  res.status(501).json({
    error: 'At this point, the client should know' +
    ' available operations based on the device type',
  });
});

router.post('/rooms/devices/operations', async (req, res) => {
  const username = req.user.username;
  const roomId = req.query.uid;
  const deviceName = req.query.devicename;
  const operation = req.query.operation;
  const operationBody = req.body;
  try {
    if (!await db.functions.isPrivileged(username, roomId)) {
      res.status(403).json({
        error: 'Not authorized',
      });
      return;
    }
    switch (operation) {
      case 'switch':
        if (operationBody.switch === 'on') {
          db.functions.updateDeviceStatus(
              username, roomId, deviceName, JSON.stringify({power: true}),
          );
        } else if (operationBody.switch === 'off') {
          db.functions.updateDeviceStatus(
              username, roomId, deviceName, JSON.stringify({power: false}),
          );
        }
        break;
      default:
        break;
    }
    res.json('success');
  } catch (error) {
    res.status(500).json({
      error: error.toString(),
    });
  }
});

/*
router.post('/:username/:roomname/:devicename/:actionname', (req, res) => {
  if (req.params.actionname === 'poweron') {
    db.models.Status.findOne({ 'id': 'qwertyuiop' }, 'power', (err, status) => {
      if (err) {
        console.error(err);
        res.status(404).json({ success: false, error: err.toString() });
      }
      status.power = true;
      status.save((error) => {
        if (error) {
          console.error(error);
          res.status(404).json({ success: false, error: error.toString() });
        }
        res.json({ success: true });
      });
    });
  } else if (req.params.actionname === 'poweroff') {
    db.models.Status.findOne({ 'id': 'qwertyuiop' }, 'power', (err, status) => {
      if (err) {
        console.error(err);
        res.status(404).json({ success: false, error: err.toString() });
      }
      status.power = false;
      status.save((error) => {
        if (error) {
          console.error(error);
          res.status(404).json({ success: false, error: error.toString() });
        }
        res.json({ success: true });
      });
    });
  }
});
*/

module.exports = router;
