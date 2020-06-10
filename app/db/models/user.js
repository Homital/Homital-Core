const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema({
  username: String,
  email: String,
  password: String,
  email_verified: Boolean,
});

const User = mongoose.model('User', UserSchema);
module.exports = User;
