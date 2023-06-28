const Device = require('../model/device.model');
const Room = require('../model/room.model');
const roomController = require('../controller/room.controller');

const deviceController = {
  getList: async (dataDevice, io, socket) => {
    const { uid, roomId } = dataDevice;
    try {
      const room = await Room.findById(roomId).populate('devicesId');
      io.to(uid).emit('listDevice', room.devicesId);
    } catch (error) {
      console.error(error);
    }
  },

  getListDevicesRunning: async (dataDevice, io, socket) => {
    const { uid, homeId } = dataDevice;
    try {
      const devices = await Device.find({ homeId: homeId, status: true }).lean();
      io.to(uid).emit("getDeviceRunning", devices);
    } catch (error) {
      console.error(error);
    }
  },

  createDevice: async (deviceData, io, socket) => {
    const { homeId, roomId, dataDevice, roomName, uid } = deviceData;

    const devices = dataDevice.map(deviceItem => {
      const { nameDevice, iconName } = deviceItem;
      return new Device({ nameDevice, iconName, homeId, roomName, roomId });
    });

    try {
      await Promise.all(devices.map(device => device.save()));

      const room = await Room.findOneAndUpdate(
        { _id: roomId },
        { $push: { devicesId: { $each: devices.map(device => device._id) } } },
        { new: true }
      ).populate('devicesId');

      await io.to(uid).emit('listDevice', room.devicesId);
      await roomController.getList(deviceData, io, socket);
    } catch (error) {
      console.error(error);
    }
  },

  updateOnOff: async (dataDevice, io, socket) => {
    io.emit('update', dataDevice);

    const { idDevice, status, roomId, homeId, uid } = dataDevice;

    try {
      const device = await Device.findById(idDevice);

      let countOn = device.countOn;
      if (status && countOn !== undefined) {
        countOn++;
      }

      await Device.findByIdAndUpdate(idDevice, { status: status, countOn: countOn });

      const room = await Room.findById(roomId).populate('devicesId');
      io.to(uid).emit('listDevice', room.devicesId);

      await deviceController.getListDevicesRunning({ uid, homeId }, io, socket);
    } catch (error) {
      console.error(error);
    }
  },

  deleteDevice: async (deviceData, io, socket) => {
    const { id, homeId, roomId } = deviceData;
    try {
      await Device.findByIdAndDelete(id);
      await Room.findOneAndUpdate(
        { _id: roomId },
        { $pull: { devicesId: id } }
      );

      await deviceController.getList(deviceData, io, socket);
      await roomController.getList(deviceData, io, socket);
    } catch (error) {
      console.error(error);
    }
  },

  getDropDownList: async (dataDevice, io, socket) => {
    const { uid, homeId } = dataDevice;

    try {
      const devices = await Device.find({
        $and: [
          { homeId: homeId },
          { $or: [{ timeOn: null }, { timeOff: null }, { dayRunning: [] }] },
        ],
      })
        .populate('roomId', 'nameRoom homeId')
        .select('nameDevice roomName iconName roomId status')
        .lean();

      // Chuyển đổi dữ liệu để tạo ra mảng options
      const options = [];
      let prevParent = null;

      devices.forEach(device => {
        const parent = device.roomName || null;
        if (parent !== prevParent) {
          options.unshift({ label: parent, value: parent });
          prevParent = parent;
        }
        options.push({
          label: device.nameDevice,
          value: device._id,
          parent: parent
        });
      });

      io.to(uid).emit('optionsList', options);
    } catch (error) {
      console.error(error);
    }
  },

  updateDeviceOnOff: async (dataDevice, io, socket) => {
    const { dayRunning, timeOn, timeOff, deviceId } = dataDevice;
    const updateData = {
      timeOn: timeOn,
      timeOff: timeOff,
      dayRunning: dayRunning
    };

    try {
      await Device.updateMany({ _id: { $in: deviceId } }, updateData, { new: true });
      await deviceController.getListDeviceTime(dataDevice, io, socket);
    } catch (error) {
      console.error('Error updating devices:', error);
    }
  },

  deleteScheduleOnOff: async (dataDevice, io, socket) => {
    const { id } = dataDevice;
    const updateData = {
      timeOn: null,
      timeOff: null,
      dayRunning: []
    };

    try {
      await Device.findOneAndUpdate({ _id: id }, updateData, { new: true });
      await deviceController.getListDeviceTime(dataDevice, io, socket);
    } catch (error) {
      console.error('Error updating device:', error);
    }
  },

  getListDeviceTime: async (dataDevice, io, socket) => {
    const { uid, homeId } = dataDevice;

    try {
      const devices = await Device.find({
        $and: [
          { homeId: homeId },
          { timeOn: { $ne: null } },
          { timeOff: { $ne: null } },
          { dayRunning: { $not: { $size: 0 } } }
        ]
      })
        .select('_id dayRunning timeOn timeOff nameDevice roomName dayRunningStatus')
        .lean();

      io.to(uid).emit('getListSchedule', devices);
    } catch (error) {
      console.error('Error getting devices:', error);
    }
  },

  updateScheduleOnOff: async (dataDevice, io, socket) => {
    const { deviceId, status } = dataDevice;
    try {
      await Device.findOneAndUpdate({ _id: deviceId }, { dayRunningStatus: status });
      await deviceController.getListDeviceTime(dataDevice, io, socket);
    } catch (error) {
      console.error(error);
    }
  }
};

module.exports = deviceController;