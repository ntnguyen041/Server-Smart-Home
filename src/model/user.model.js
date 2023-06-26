const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  nameUser: { type: String, required: true },
  phoneUser: { type: String, required: true },
  imageUser: { type: String, required: false },
  homeId: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Home' }],
});

const User = mongoose.model('User', userSchema);

module.exports = User;