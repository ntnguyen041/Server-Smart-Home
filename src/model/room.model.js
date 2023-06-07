const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  nameRoom: {type: String, required: true},
  imageRoom: {type: String, required: false},
  devicesId: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Device' }]
});

const Room = mongoose.model('Room', roomSchema);

module.exports = Room;
