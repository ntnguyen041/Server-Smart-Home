const Device = require('../model/device.model');
const Room = require('../model/room.model');
const roomController = require('../controller/room.controller');

const deviceController = {
  getList: async (roomId, io, socket) => {
    try {
      const room = await Room.findById(roomId).populate('devicesId');
      io.to(socket.id).emit('listDevice', room.devicesId);
    } catch (error) {
      console.error(error);
    }
  },

  getListDevicesRunning: async (homeId, io, socket) => {
    try {
      const devices = await Device.find({ homeId: homeId, status: true });
      io.to(socket.id).emit("getDeviceRunning", devices);
    } catch (error) {
      console.error(error);
    }
  },

  getDetail: async (req, res) => {
    const { deviceId } = req.params;
    try {
      const device = await Device.findById(deviceId);
      if (!device) {
        return res.status(404).json({ message: 'Device not found' });
      }
      res.json(device);
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: 'Internal server error' });
    }
  },

  createDevice: async (deviceData, io, socket) => {
    const { homeId, roomId, dataDevice, roomName } = deviceData;
    const room = await Room.findById(roomId);

    const devices = dataDevice.map(deviceItem => {
      const { nameDevice, iconName } = deviceItem;
      return new Device({ nameDevice, iconName, homeId, roomName, roomId });
    });

    await Promise.all(devices.map(device => device.save()));

    devices.forEach(device => {
      room.devicesId.push(device._id);
    });

    await room.save();

    const listDevice = await Room.findById(roomId).populate('devicesId');
    await io.to(socket.id).emit('listDevice', listDevice.devicesId);
    await roomController.getList(homeId, io, socket);
  },

  updateOnOff: async (dataDevice, io, socket) => {
    const { idDevice, status, roomId, homeId } = dataDevice;
    try {
      await Device.findOneAndUpdate({ _id: idDevice }, { status: status })
      const room = await Room.findById(roomId).populate('devicesId');
      io.to(socket.id).emit('listDevice', room.devicesId);
      await deviceController.getListDevicesRunning(homeId, io, socket)
    } catch (error) {
      console.error(error);
    }
  },

  updateDevice: async (req, res) => {
    const { deviceId } = req.params;
    const { name, type, status } = req.body;
    try {
      const device = await Device.findByIdAndUpdate(deviceId, { name, type, status }, { new: true });
      if (!device) {
        return res.status(404).json({ message: 'Device not found' });
      }
      res.json(device);
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: 'Internal server error' });
    }
  },

  deleteDevice: async (deviceData, io, socket) => {
    const { id, homeId, roomId } = deviceData;
    try {
      await Device.findByIdAndDelete(id);
      await Room.updateOne(
        { _id: roomId },
        { $pull: { devicesId: id } },
      );
      await deviceController.getList(roomId, io, socket);
      await roomController.getList(homeId, io, socket);
    } catch (error) {
      console.error(error);
    }
  },

  getDropDownList: async (io, socket) => {
    const devices = await Device.find({
      $and: [
        { timeOn: { $ne: null } },
        { timeOff: { $ne: null } },
        { dayRunning: { $ne: [] } }
      ]
    })
    .populate('roomId', 'nameRoom homeId')
    .select('nameDevice roomName iconName roomId status');
  
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
  
    io.to(socket.id).emit('optionsList', options);
  },

  updateDeviceOnOff: async (dataDevice, io, socket) => {
    const { dayRunning, timeOn, timeOff, deviceId } = dataDevice;

    const updateData = {
      timeOn: timeOn,
      timeOff: timeOff,
      dayRunning: dayRunning
    };

    Device.updateMany({ _id: { $in: deviceId } }, updateData, { new: true })
      .then(updatedDevices => {
        console.log('Updated devices:', updatedDevices);
        deviceController.getListDeviceTime(io, socket)

      })
      .catch(error => {
        console.error('Error updating devices:', error);
      });
  },

  getListDeviceTime: async (io, socket) => {
    Device.find({
      $and: [
        { timeOn: { $ne: null } },
        { timeOff: { $ne: null } },
        { dayRunning: { $not: { $size: 0 } } }
      ]
    })
      .select('_id dayRunning timeOn timeOff nameDevice roomName dayRunningStatus')
      .then(devices => {
        io.to(socket.id).emit('getListSchedule', devices);
      })
      .catch(error => {
        console.error('Error getting devices:', error);
      });
  },

  updateScheduleOnOff: async (dataDevice, io, socket) => {
    const { deviceId, status } = dataDevice;
    await Device.findOneAndUpdate({ _id: deviceId }, { dayRunningStatus: status })
      .then(() => {
        deviceController.getListDeviceTime(io, socket);
      })
  }
};

module.exports = deviceController;