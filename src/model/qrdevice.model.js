const mongoose = require('mongoose');

const QRpin = new mongoose.Schema({
  nameDevice: { type: String, required: true },
  iconName: { type: String, required: true },
  pinEsp: { type: Number, required: true },
});

module.exports = mongoose.model('QRpin', QRpin);