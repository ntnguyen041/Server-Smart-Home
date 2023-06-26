const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  uid: { type: String, required: true },
  nameUser: { type: String, required: true },
  phoneUser: { type: String, required: true },
  imageUser: { type: String, required: false },
  admin:{type:Number,required:false},
  homeId: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Home' }],
});

const User = mongoose.model('User', userSchema);

module.exports = User;