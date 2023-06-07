const mongoose = require('mongoose');

const deviceSchema = new mongoose.Schema({
  name: { type: String, required: true },
  iconName: {type: String, require: true},
  status: { type: Boolean, default: false },
  consumes: {type: Number, default: 0},
  timeOn: {type: Date, require: false},
  timeOff: {type: Date, require: false},
  roomId: { type: mongoose.Schema.Types.ObjectId, ref: 'Room' }
});

module.exports = mongoose.model('Device', deviceSchema);