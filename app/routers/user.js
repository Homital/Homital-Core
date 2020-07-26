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
          db.functions.updateDeviceUsage('on ' + new Date().getTime());
        } else if (operationBody.switch === 'off') {
          db.functions.updateDeviceStatus(
              username, roomId, deviceName, JSON.stringify({power: false}),
          );
          db.functions.updateDeviceUsage('off ' + new Date().getTime());
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

router.get('/data', async (req, res) => {
  const username = req.user.username;
  const roomId = req.query.uid;
  const deviceName = req.query.devicename;
  if (req.query.demo) {
    const usage = [];
    let date = new Date();
    for (let i = 0; i < 7; i++) {
      usage.push({
        date: date.toISOString().split('T')[0],
        usage: Math.floor(Math.random() * 1400),
      });
      date = new Date(date.getTime()-1000*60*60*24);
    }
    res.json(usage);
    return;
  }
  const usageHistory = await db.functions.getDeviceUsage(
      username, roomId, deviceName,
  );
  const usageHistoryList = usageHistory.split('\n')
      .map((x) => x.split(' '));
  const usage = [];
  let date = new Date();
  for (let i = 0; i < 7; i++) {
    const lastDate = new Date(date.getTime()-1000*60*60*24);
    const lastDayList = usageHistoryList
        .filter(dateFilter(lastDate))
        .sort((a, b) => a[1]-b[1]);
    const thisDayList = usageHistoryList
        .filter(dateFilter(date))
        .sort((a, b) => a[1]-b[1]);
    const lastDatLastRecord = lastDayList[lastDayList.length-1];
    let dailyUsage = 0;
    let lastTime = new Date(date.toDateString()).getTime();
    let lastOn = false;
    if (lastDatLastRecord && lastDatLastRecord[0] === 'on') {
      lastOn = true;
    }
    for (const i of thisDayList) {
      if (i[0]==='off' && lastOn) {
        dailyUsage += Math.floor((i[1] - lastTime) / 1000 / 60);
        lastOn = false;
      } else if (i[0]==='on' && !lastOn) {
        lastTime = i[1];
        lastOn = true;
      }
    }
    if (lastOn) {
      dailyUsage += Math.floor(
          (new Date(date.toDateString())
              .getTime()+1000*60*60*24-lastTime) / 1000 / 60,
      );
    }
    usage.push({
      date: date.toISOString().split('T')[0],
      usage: dailyUsage,
    });
    date = new Date(date.getTime()-1000*60*60*24);
  }
  res.json(usage);
  return;
});

/**
 * Date filter producer
 * @param {Date} date
 * @return {Function} date filter
 */
function dateFilter(date) {
  new Date();
  const dateStart = new Date(date.toDateString()).getTime();
  const dateEnd = dateStart + 1000*60*60*24;
  return (x) => {
    return (x[1] >= dateStart && x[1] < dateEnd);
  };
}

module.exports = router;
