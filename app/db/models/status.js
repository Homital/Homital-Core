let mongoose = require("mongoose");
let Schema = mongoose.Schema;

let StatusSchema = new Schema({
  id: String,
  power: Boolean
});

let Status = mongoose.model("Status", StatusSchema);
module.exports = Status;