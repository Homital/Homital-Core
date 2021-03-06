const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const UserSchema = new Schema({
  username: String,
  email: String,
  password: String,
  email_verified: Boolean,
  rooms: [
    {
      name: String,
      roomId: String,
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
});

const User = mongoose.model('User', UserSchema);

module.exports = {
  User,
  UserSchema,
};
