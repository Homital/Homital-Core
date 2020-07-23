const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const RoomSchema = new Schema({
  members: [
    {
      username: String,
      role: {
        type: String,
        enum: [
          'owner',
          'admin',
          'member',
          'viewer',
        ],
        default: 'viewer',
      },
    },
  ],
  devices: [
    {
      name: String,
      type: String,
    },
  ],
});

const Room = mongoose.model('Room', RoomSchema);

module.exports = {
  Room,
  RoomSchema,
};
