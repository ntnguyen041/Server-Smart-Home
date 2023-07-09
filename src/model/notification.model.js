const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    title: { type: String, required: true },
    subTitle: { type: String, required: true },
    iconName: { type: String, required: true },
    homeId: { type: String, required: true },
});

module.exports = mongoose.model('Notification', notificationSchema);