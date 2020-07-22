const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const TokenSchema = new Schema({
  token: String,
});

const Token = mongoose.model('Token', TokenSchema);

module.exports = {
  Token,
  TokenSchema,
};
