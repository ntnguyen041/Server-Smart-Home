const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  phone: {
    type: String,
    required: true
  },
  otp: {
    type: String,
    required: true
  },
  // token: {
  //   type: String,
  //   required: true
  // }
});

module.exports = mongoose.model('UserTest', userSchema);