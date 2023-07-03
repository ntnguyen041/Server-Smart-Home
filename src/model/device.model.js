const mongoose = require('mongoose');

const deviceSchema = new mongoose.Schema({
  nameDevice: { type: String, required: true },
  iconName: { type: String, required: true },
  homeId: { type: String, required: true },
  roomName: { type: String, required: true },
  roomId: { type: String, required: true },
  pinEsp: { type: Number, required: true },
  status: { type: Boolean, default: false },
  consumes: { type: Number, default: 0 },
  countOn: { type: Number, default: 0 },
  timeOn: { type: String, default: null },
  timeOff: { type: String, default: null },
  dayRunning: { type: [String], default: [] },
  dayRunningStatus: { type: Boolean, default: true }
});

module.exports = mongoose.model('Device', deviceSchema);