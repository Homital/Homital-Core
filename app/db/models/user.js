var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var UserSchema = new Schema({
  username: String,
  email: String,
  password: String,
  email_verified: Boolean
});

var User = mongoose.model("User", UserSchema);
module.exports = User;