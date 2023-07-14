
const Notification = require('../model/notification.model');
const moment = require("moment-timezone");


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
            const now = new Date();
            const notifications = await Notification.find({ homeId: homeId });
            const formattedNotifications = notifications.map((notification) => {
                const formattedNotification = { ...notification.toObject() };
                if (notification.timeCreate) {
                    const timeCreate = new Date(notification.timeCreate);
                    const formattedTimeString = moment(timeCreate).locale("en").from(now);
                    formattedNotification.timeCreate = formattedTimeString;
                }
                return formattedNotification;
            });
            io.to(homeId).emit("getListNotification", formattedNotifications);
        } catch (error) {
            console.error("Error retrieving notifications:", error);
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