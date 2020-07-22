const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const DeviceTypeSchema = new Schema({});

const DeviceType = mongoose.model('DeviceType', DeviceTypeSchema);

module.exports = {
  DeviceType,
  DeviceTypeSchema,
};
