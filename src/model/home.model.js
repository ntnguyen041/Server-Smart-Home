const mongoose = require('mongoose');

const homeSchema = new mongoose.Schema({
  nameHome: {type: String, required: true},
  uid: {type: String, required: true},
  roomId: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Room' }]
});

const Home = mongoose.model('Home', homeSchema);

module.exports = Home;
