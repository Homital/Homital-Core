let mongoose = require("mongoose");
let Schema = mongoose.Schema;

let TokenSchema = new Schema({
  token: String
});

let Token = mongoose.model("Token", TokenSchema);
module.exports = Token;