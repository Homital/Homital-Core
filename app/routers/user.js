const express = require('express');
// eslint-disable-next-line new-cap
const router = express.Router(); // Not my problem :P
// const db = require('../db/db');
const utils = require('../utils/utils');

/** Temporary */

/*
const users = [];
*/

/*
userAlice = {
  username: "Alice",
  rooms: [
    {
      roomname: "room1",
      devices: [
        {
          devicename: "do"
        }
      ]
    }
  ]
}
*/

/*
const deviceTypes = [
  {
    name: 'homital-L0',
    status: {
      power: false,
    },
    operations: [
      {
        name: 'On/Off',
        ui: 'switch',
        id: 'switch',
        action: (options, status) => {
          status.power = ! status.power;
          return status.power;
        },
      },
    ],
  },
  {
    name: 'homital-P0',
    status: {
      power: false,
    },
    operations: [
      {
        name: 'On/Off',
        ui: 'switch',
        id: 'switch',
        action: (options, status) => {
          status.power = ! status.power;
          return status.power;
        },
      },
    ],
  },
];
*/

/** End Temporary */

router.use(utils.authenticateToken);

router.get('/rooms', (req, res) => {
  const username = req.user.username;
});

router.post('/rooms', (req, res) => {
  const username = req.user.username;
});

router.delete('/rooms', (req, res) => {
  const username = req.user.username;
});

router.get('/rooms/members', (req, res) => {
  const username = req.user.username;
});

router.post('/rooms/members', (req, res) => {
  const username = req.user.username;
});

router.put('/rooms/members', (req, res) => {
  const username = req.user.username;
});

router.delete('/rooms/members', (req, res) => {
  const username = req.user.username;
});

/*
router.get('/:username/rooms', (req, res) => {
  for (const user of users) {
    if (user.username === req.params.username) {
      const rooms = [];
      for (const rm of user.rooms) {
        rooms.push({
          name: rm.roomname,
          icon: rm.icon,
        });
      }
      res.json(rooms);
      return;
    }
  }
  users.push({
    username: req.params.username,
    rooms: [],
  });
  res.json([]);
  return;
});

router.post('/:username/rooms', (req, res) => {
  for (const user of users) {
    if (user.username === req.params.username) {
      for (const rm of user.rooms) {
        if (rm.roomname === req.body.name) {
          res.status(400).json({
            success: false,
            error: 'room name exists',
          });
          return;
        }
      }
      user.rooms.push({
        roomname: req.body.name,
        icon: req.body.icon,
        devices: [],
      });
      res.json(null);
      return;
    }
  }
  users.push({
    username: req.params.username,
    rooms: [
      {
        roomname: req.body.name,
        icon: req.body.icon,
        devices: [],
      },
    ],
  });
  res.json(null);
  return;
});

router.get('/:username/rooms/:room/devices', (req, res) => {
  for (const user of users) {
    if (user.username === req.params.username) {
      for (const rm of user.rooms) {
        if (rm.roomname === req.params.room) {
          const devices = [];
          for (const device of rm.devices) {
            devices.push({
              type: device.type,
              name: device.name,
              room: device.room,
            });
          }
          res.json(devices);
          return;
        }
      }
      res.json({
        success: false,
        error: 'room does not exist',
      });
      return;
    }
  }
  users.push({
    username: req.params.username,
    rooms: [],
  });
  res.json({
    success: false,
    error: 'room does not exist',
  });
  return;
});

router.post('/:username/rooms/:room/devices', (req, res) => {
  for (const user of users) {
    if (user.username === req.params.username) {
      for (const rm of user.rooms) {
        if (rm.roomname === req.params.room) {
          for (const device of rm.devices) {
            if (device.name === req.body.name) {
              res.status(400).json({
                success: false,
                error: 'device name exists',
              });
              return;
            }
          }
          for (const dt of deviceTypes) {
            if (dt.name === req.body.type) {
              rm.devices.push({
                type: req.body.type,
                name: req.body.name,
                room: req.params.room,
                status: dt.status,
              });
              res.json(null);
              return;
            }
          }
          res.status(400).json({
            success: false,
            error: 'device not supported',
          });
        }
      }
      res.json({
        success: false,
        error: 'room does not exist',
      });
      return;
    }
  }
  users.push({
    username: req.params.username,
    rooms: [],
  });
  res.json({
    success: false,
    error: 'room does not exist',
  });
  return;
});

router.get(
    '/:username/rooms/:room/devices/:device/operations',
    (req, res) => {
      for (const user of users) {
        if (user.username === req.params.username) {
          for (const rm of user.rooms) {
            if (rm.roomname === req.params.room) {
              for (const device of rm.devices) {
                if (device.name === req.params.device) {
                  for (const dt of deviceTypes) {
                    if (dt.name === device.type) {
                      res.json(dt.operations);
                      return;
                    }
                  }
                  res.status(500).json({
                    success: false,
                    error: `device not supported: ${device.type}`,
                  });
                  return;
                }
              }
              res.status(400).json({
                success: false,
                error: `device not found: ${req.params.device}`,
              });
              return;
            }
          }
          res.json({
            success: false,
            error: 'room does not exist',
          });
          return;
        }
      }
      users.push({
        username: req.params.username,
        rooms: [],
      });
      res.json({
        success: false,
        error: 'room does not exist',
      });
      return;
    },
);

router.post(
    '/:username/rooms/:room/devices/:device/operations/:operation',
    (req, res) => {
      for (const user of users) {
        if (user.username === req.params.username) {
          for (const rm of user.rooms) {
            if (rm.roomname === req.params.room) {
              for (const device of rm.devices) {
                if (device.name === req.params.device) {
                  for (const dt of deviceTypes) {
                    if (dt.name === device.type) {
                      for (const op of dt.operations) {
                        if (op.id === req.params.operation) {
                          res.json(op.action(req.body, device.status));
                          return;
                        }
                      }
                      res.status(400).json(
                          {
                            success: false,
                            error: 'operation not supported',
                          },
                      );
                      return;
                    }
                  }
                  res.status(500).json({
                    success: false,
                    error: 'device not supported',
                  });
                  return;
                }
              }
              res.status(400).json({
                success: false,
                error: 'device not found',
              });
              return;
            }
          }
          res.json({
            success: false,
            error: 'room does not exist',
          });
          return;
        }
      }
      users.push({
        username: req.params.username,
        rooms: [],
      });
      res.json({
        success: false,
        error: 'room does not exist',
      });
      return;
    },
);*/

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
