const mongoose = require('mongoose');
const Status = require('./models/status').Status;
const User = require('./models/user').User;
const Token = require('./models/token').Token;
const Room = require('./models/room').Room;
const Device = require('./models/device').Device;
const bcrypt = require('bcrypt');

const dbconnectionstring = process.env.HOMITALDB_CONNECTIONSTRING;

if (!dbconnectionstring) {
  console.error(
      new Error('HOMITALDB_CONNECTIONSTRING env var not set'),
  );
  process.exit(1);
}
mongoose.connect(
    dbconnectionstring,
    {useNewUrlParser: true, useUnifiedTopology: true},
);
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error'));
db.once('open', function(callback) {
  console.log('Connection Successful');
});

/**
 * Get the user using his email
 * @param {String} email
 * @return {DocumentQuery} // import type!
 */
async function getUserByEmail(email) {
  // todo: get all instead of just one and return an error if got more than one
  const theUser = await User.findOne({email});
  // console.log('getUserByEmail() = ', theUser);
  return theUser;
}

/**
 * Get the user using his username
 * @param {String} username
 * @return {DocumentQuery}
 */
async function getUserByUsername(username) {
  // todo: get all instead of just one and return an error if got more than one
  const theUser = await User.findOne({username});
  // console.log('getUserByUsername() = ', theUser);
  return theUser;
}

/**
 * Register a new user
 * Create a new document in the database
 * @param {String} username
 * @param {String} email
 * @param {String} password
 * @return {object} response object
 */
async function registerUser(username, email, password) {
  // also no validation of input format
  const res = await checkExistance(username, email);
  if (res === undefined) {
    // console.log("saving to db...");
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({
      username: username,
      email: email,
      password: hashedPassword,
      email_verified: false,
    });
    await user.save();
    // todo: check for error from user.save()
  }
  return res === undefined ?
    {success: true} :
    {success: false, error: res.toString()};
}

/**
 * Change password
 * @param {string} email
 * @param {string} password
 * @return {number} statusCode
 */
async function changePassword(email, password) {
  const hashedPassword = await bcrypt.hash(password, 10);
  const res = await User.updateOne({email: email}, {password: hashedPassword});
  if (res.n) {
    if (res.nModified) {
      return 200;
    }
    return 500;
  }
  return 404;
}

/**
 * Check whether username already exists, or if the email was registered
 * @param {String} username
 * @param {String} email
 * @return {String} error message or undefined if check passed
 */
async function checkExistance(username, email) {
  let errorMessage;
  // the following 2 async functions should run in parallel..
  if (await getUserByUsername(username)) {
    // username already exists
    errorMessage = 'username already registered';
  } else if (await getUserByEmail(email)) {
    // email already registered
    errorMessage = 'email already registered';
  }
  return errorMessage;
}


/**
 * Save the refresh token as a new document in the database
 * @param {String} token - refresh token
 * @return {Number} status (0 for success, anything else for failure)
 */
async function pushRefreshToken(token) {
  const toke = new Token({token: token});
  await toke.save();
  // todo: check for errs
  return 0;
}

/**
 * Check if the provided refresh token is valid
 * (will change callback to something better...)
 * @param {String} token - refresh token
 * @param {Function} callback - emmm (todo: use async/await)
 */
async function checkRefreshToken(token, callback) {
  await Token.findOne({token: token}, (err, tok) => {
    if (err) {
      return callback(err.toString());
    }
    if (tok === null) {
      return callback('refresh token not authorized');
    }
    return callback(null);
  });
}

/**
 * Remove the provided refresh token from database
 * (will change callback to something better...)
 * @param {String} token - refresh token
 * @param {Function} callback - emmm
 */
function removeRefreshToken(token, callback) {
  Token.findOneAndDelete({token: token}, (err, tok) => {
    if (err) {
      return callback(err.toString());
    }
    if (tok === null) {
      return callback('refresh token not authorized');
    }
    return callback(null);
  });
}

/**
 * Check if the given user is the owner or an admin of the given room
 * @param {String} username
 * @param {String} roomId
 * @return {Boolean} isPrivileged?
 */
async function isPrivileged(username, roomId) {
  const rm = await Room.findOne({
    _id: roomId,
    members: {
      $elemMatch: {
        username,
        role: {
          $in: [
            'owner',
            'admin',
          ],
        },
      },
    },
  });
  if (rm) {
    return true;
  } else {
    return false;
  }
}

/**
 * Create a  new room
 * @param {String} username
 * @param {String} roomName
 * @return {String} roomId
 */
async function createRoom(username, roomName) {
  const room = new Room(
      {
        members: [
          {
            username,
            role: 'owner',
          },
        ],
      },
  );
  const rm = await room.save();
  const roomId = rm._id;
  await User.updateOne(
      {username},
      {$push: {
        rooms: {
          name: roomName,
          roomId,
          role: 'owner',
        },
      }},
  );
  return roomId;
}

/**
 * Get rooms of a user
 * @param {String} username
 * @return {Array} array of rooms
 */
async function getRooms(username) {
  const user = await getUserByUsername(username);
  const rooms = [];
  for (const room of user.rooms) {
    rooms.push({
      name: room.name,
      uid: room.roomId,
      role: room.role,
    });
  }
  return rooms;
}

/**
 * Update the info of one room
 * @param {String} username
 * @param {String} roomId
 * @param {String} newName
 */
async function updateRoom(username, roomId, newName) {
  await User.updateOne(
      {
        'username': username,
        'rooms.roomId': roomId,
      },
      {$set: {
        'rooms.$.name': newName,
      }},
  );
  return;
}

/**
 * Delete a room
 * @param {String} username
 * @param {String} roomId
 */
async function deleteRoom(username, roomId) {
  await User.updateOne(
      {username},
      {$pull: {rooms: {roomId}}},
  );
  return;
}

/**
 * Check if a member exists in a room
 * @param {String} username
 * @param {String} roomId
 * @return {Number} number matched
 */
async function memberExists(username, roomId) {
  const room = await Room.find({
    _id: roomId,
    members: {
      $elemMatch: {username},
    },
  });
  console.log('n = ', room.length);
  return room.length;
}

/**
 * add a new member to a room
 * @param {String} username
 * @param {String} roomId
 * @param {String} newMemberUsername
 * @param {String} role
 * @param {String} roomName
 * @return {Number} Status of operation:
 * <br>`0` - successful
 * <br>`1` - unauthorized
 * <br>`2` - unknown
 */
async function addRoomMember(
    username, roomId, newMemberUsername, role, roomName,
) {
  const updateRoomResult = await Room.updateOne(
      {
        _id: roomId,
        members: {
          $elemMatch: {
            username,
            role: {
              $in: [
                'owner',
                'admin',
              ],
            },
          },
        },
      },
      {$push: {
        members: {
          username: newMemberUsername,
          role,
        },
      }},
  );
  if (!updateRoomResult.n) {
    return 1;
  } else if (!updateRoomResult.nModified) {
    return 2;
  }
  const updateUserResult = await User.updateOne(
      {username: newMemberUsername},
      {$push: {
        rooms: {
          name: roomName,
          roomId,
          role,
        },
      }},
  );
  if (updateUserResult.n) {
    return 0;
  }
  return 2;
}

/**
 * Get members of a room
 * @param {String} username
 * @param {String} roomId
 */
async function getRoomMembers(username, roomId) {
  const members = [];
  const room = await Room.findOne(
      {
        _id: roomId,
        members: {
          $elemMatch: {username},
        },
      },
  );
  for (const member of room.members) {
    members.push({
      username: member.username,
      role: member.role,
    });
  }
  return members;
}

// Missing status checking
/**
 * Delete a member from a room
 * @param {String} username
 * @param {String} roomId
 * @param {String} usernameToRemove
 */
async function deleteRoomMember(username, roomId, usernameToRemove) {
  await Room.updateOne(
      {
        _id: roomId,
        members: {
          $elemMatch: {
            username,
            role: {
              $in: [
                'owner',
                'admin',
              ],
            },
          },
        },
      },
      {$pull: {
        members: {
          username: usernameToRemove,
        },
      }},
  );
  await User.updateOne(
      {username: usernameToRemove},
      {$pull: {
        rooms: {
          roomId,
        },
      }},
  );
  return;
}

// Missing status checking
/**
 * Update a member of a room
 * @param {String} username
 * @param {String} roomId
 * @param {String} usernameToUpdate
 * @param {String} role
 */
async function updateRoomMember(username, roomId, usernameToUpdate, role) {
  await Room.updateOne(
      {
        '_id': roomId,
        'members': {
          $elemMatch: {username: usernameToUpdate},
        },
      },
      {$set: {
        'members.$.role': role,
      }},
  );
  await User.updateOne(
      {
        'username': usernameToUpdate,
        'rooms': {
          $elemMatch: {roomId},
        },
      },
      {$set: {
        'rooms.$.role': role,
      }},
  );
  return;
}

/**
 * Add a new device
 * @param {String} username
 * @param {String} roomId
 * @param {String} deviceType
 * @param {String} deviceName
 * @return {Number} Status of operation:
 * <br>`0` - successful
 * <br>`1` - unauthorized
 * <br>`2` - knknown
 */
async function addRoomDevice(
    username, roomId, deviceType, deviceName,
) {
  const updateRoomResult = await Room.updateOne(
      {
        _id: roomId,
        members: {
          $elemMatch: {
            username,
            role: {
              $in: [
                'owner',
                'admin',
              ],
            },
          },
        },
      },
      {$push: {
        devices: {
          name: deviceName,
          type: deviceType,
        },
      }},
  );
  if (!updateRoomResult.n) {
    console.log('updateRoomResult.n:', updateRoomResult.n);
    return 1;
  } else if (!updateRoomResult.nModified) {
    return 2;
  }
  const device = new Device(
      {
        type: deviceType,
        name: deviceName,
        roomId,
      },
  );
  await device.save();
  return 0;
}

/**
 * Update a device
 * @param {String} username
 * @param {String} roomId
 * @param {String} deviceName
 * @param {String} newName
 */
async function updateRoomDevice(
    username, roomId, deviceName, newName,
) {
  await Room.updateOne(
      {
        '_id': roomId,
        'devices': {
          $elemMatch: {
            name: deviceName,
          },
        },
      },
      {$set: {
        'devices.$.name': newName,
      }},
  );
  await Device.updateOne(
      {
        name: deviceName,
        roomId,
      },
      {$set: {
        name: newName,
      }},
  );
}

/**
 * Get devices in a room
 * @param {String} username
 * @param {String} roomId
 */
async function getRoomDevices(
    username, roomId,
) {
  const devices = [];
  const room = await Room.findOne(
      {
        _id: roomId,
        members: {
          $elemMatch: {username},
        },
      },
  );
  for (const device of room.devices) {
    devices.push({
      type: device.type,
      name: device.name,
    });
  }
  return devices;
}

/**
 * Remove one device
 * @param {String} username
 * @param {String} roomId
 * @param {String} deviceName
 */
async function removeRoomDevice(
    username, roomId, deviceName,
) {
  await Room.updateOne(
      {
        _id: roomId,
        members: {
          $elemMatch: {
            username,
            role: {
              $in: [
                'owner',
                'admin',
              ],
            },
          },
        },
      },
      {$pull: {
        devices: {
          name: deviceName,
        },
      }},
  );
}

/**
 * Get the status of a device
 * @param {String} username
 * @param {String} roomId
 * @param {String} deviceName
 * @return {String} status
 */
async function getDeviceStatus(
    username, roomId, deviceName,
) {
  const status = await Device.findOne(
      {
        name: deviceName,
        roomId,
      },
  );
  return status;
}

/**
 * Update the status of a device
 * @param {String} username
 * @param {String} roomId
 * @param {String} deviceName
 * @param {String} status
 */
async function updateDeviceStatus(
    username, roomId, deviceName, status,
) {
  Device.updateOne(
      {
        name: deviceName,
        roomId,
      },
      {$set: {
        status,
      }},
  );
}

module.exports = {
  models: {
    Status: Status,
    User: User,
  },
  functions: {
    getUserByEmail,
    getUserByUsername,
    registerUser,
    pushRefreshToken,
    checkRefreshToken,
    removeRefreshToken,
    changePassword,
    getRooms,
    createRoom,
    updateRoom,
    deleteRoom,
    getRoomMembers,
    addRoomMember,
    updateRoomMember,
    deleteRoomMember,
    addRoomDevice,
    updateRoomDevice,
    getRoomDevices,
    removeRoomDevice,
    getDeviceStatus,
    updateDeviceStatus,
    isPrivileged,
    memberExists,
  },
};
