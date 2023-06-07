const mongoose = require('mongoose');

const homeSchema = new mongoose.Schema({
  nameHome: {type: String, require: true},
  rooms: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Room' }]
});

const Home = mongoose.model('Home', homeSchema);

module.exports = Home;
