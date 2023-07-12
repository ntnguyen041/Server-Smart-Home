
const Notification = require('../model/notification.model');

const notificationController = {
    createNotification: async (data, io) => {
        try {
            const { homeId, iconName, title, subTitle } = data;
            const notification = await Notification.create({
                title: title,
                subTitle: subTitle,
                iconName: iconName,
                homeId: homeId
            });
            notificationController.getListNotification(homeId, io)
            // console.log('Notification created successfully:', notification);
            // return notification;
        } catch (error) {
            console.error('Error creating notification:', error);
            throw error;
        }
    },
    getListNotification: async (homeId, io) => {
        try {
            const notifications = await Notification.find({ homeId: homeId });
            io.to(homeId).emit('getListNotification', notifications)
        } catch (error) {
            console.error('Error retrieving notifications:', error);
            throw error;
        }
    },
    deleteNotification: async (notificationData, io) => {
        try {
            const { homeId, notificationId } = notificationData;
            await Notification.findByIdAndDelete(notificationId);
            notificationController.getListNotification(homeId, io);
        } catch (error) {
            console.error('Error retrieving notifications:', error);
            throw error;
        }
    }
};

module.exports = notificationController;