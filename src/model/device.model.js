const mongoose = require('mongoose');

const deviceSchema = new mongoose.Schema({
  consumes: {type: Number, require: true},
  nameDevice: {type: String, require: true},
  statusOnOff: {type: Boolean, require: true},
  timeON: {type: Date, require: true},
  timeOff: {type: Date, require: true}
});

const Device = mongoose.model('Device', deviceSchema);

module.exports = Device;