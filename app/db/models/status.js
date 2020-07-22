const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const StatusSchema = new Schema({
  id: String,
  power: Boolean,
});

const Status = mongoose.model('Status', StatusSchema);

module.exports = {
  Status,
  StatusSchema,
};
