const mongoose = require('mongoose');
const Status = require('./models/status').Status;
const User = require('./models/user').User;
const Token = require('./models/token').Token;
const Room = require('./models/room').Room;
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
  let theUser;
  await User.findOne({email: email}, (err, user) => {
    if (err) {
      console.log(err);
    }
    console.log('getUserByEmail:', user);
    theUser = user;
  });
  console.log('getUserByEmail() = ', theUser);
  return theUser;
}

/**
 * Get the user using his username
 * @param {String} username
 * @return {DocumentQuery}
 */
async function getUserByUsername(username) {
  // todo: get all instead of just one and return an error if got more than one
  let theUser;
  await User.findOne({username}, (err, user) => {
    if (err) {
      console.log(err);
    }
    theUser = user;
  });
  console.log('getUserByUsername() = ', theUser);
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
  const res = await User.updateOne({email: email}, {password: password});
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
  if (await getUserByUsername(username) != null) {
    // username already exists
    errorMessage = 'username already registered';
  } else if (await getUserByEmail(email) != null) {
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
 * @param {Function} callback - emmm
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
  let roomId;
  await room.save(async (err, room) => {
    if (err) {
      console.log(err);
    }
    roomId = room._id;
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
  });
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
 * add a new member to a room
 * @param {String} username
 * @param {String} roomId
 * @param {String} newMemberUsername
 * @param {String} role
 * @param {String} roomName
 * @return {Number} Status of operation:
 * <br>`0` - successful
 * <br>`1` - unauthorized
 * <br>`2` - knknown
 */
async function addRoomMember(
    username, roomId, newMemberUsername, role, roomName,
) {
  const updateRoomResult = await Room.updateOne(
      {
        _id: roomId,
        members: {
          $in: [
            {
              username,
              role: {
                $in: [
                  'owner',
                  'admin',
                ],
              },
            },
          ],
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
  if (updateUserResult) {
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
  await Room.findOne({username}, (err, room) => {
    if (err) {
      console.log(err);
    }
    for (const member of room.members) {
      members.push({
        username: member.username,
        role: member.role,
      });
    }
  });
  return members;
}

//Missing status checking
/**
 * delete a member from a room
 * @param {String} username
 * @param {String} roomId
 * @param {String} usernameToRemove
 */
async function deleteRoomMember(username, roomId, usernameToRemove) {
  await Room.updateOne(
      {
        _id: roomId,
        members: {
          $in: [
            {
              username,
              role: {
                $in: [
                  'owner',
                  'admin',
                ],
              },
            },
          ],
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

//Missing status checking
/**
 * update a member of a room
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
          $in: [
            {
              username,
              role: {
                $in: [
                  'owner',
                  'admin',
                ],
              },
            },
          ],
        },
        'members.username': usernameToUpdate,
      },
      {$set: {
        'members.$.role': role,
      }},
  );
  await User.updateOne(
      {
        'username': usernameToUpdate,
        'rooms.roomId': roomId,
      },
      {$set: {
        'rooms.$.role': role,
      }},
  );
  return;
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
  },
};
