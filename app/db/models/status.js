var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var StatusSchema = new Schema({
  id: String,
  power: Boolean
});

var Status = mongoose.model("Status", StatusSchema);
module.exports = Status;