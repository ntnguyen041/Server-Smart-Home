const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  nameRoom: {type: String, require: true},
  homeID: String, 
  devices: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Device' }]
});

const Room = mongoose.model('Room', roomSchema);

module.exports = Room;
