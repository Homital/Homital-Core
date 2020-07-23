const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const DeviceSchema = new Schema({
  type: String,
  name: String,
  roomId: String,
  status: String,
});

const Device = mongoose.model('Device', DeviceSchema);

module.exports = {
  Device,
  DeviceSchema,
};
