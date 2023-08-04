const Device = require('../model/device.model');
const Room = require('../model/room.model');
const User = require('../model/user.model');
const roomController = require("./room.controller");
const moment = require('moment')

const filterDevices = (devices, currentDateTime) => {
  return devices.filter(device => {
    const timeOn = moment(`${currentDateTime.toLocaleDateString()} ${device.timeOn}`, 'MM/DD/YYYY hh:mm A').toDate();
    const timeOff = moment(`${currentDateTime.toLocaleDateString()} ${device.timeOff}`, 'MM/DD/YYYY hh:mm A').toDate();
    const dayRunning = device.dayRunning.includes('everyday') || device.dayRunning.includes(currentDateTime.toLocaleString('en-US', { weekday: 'short' }));
    return moment(currentDateTime).isBetween(timeOn, timeOff, null, '[]') && dayRunning && device.dayRunningStatus;
  });
};

const emitButtonStateAndSave = async (devicesToUpdate, io, status) => {
  const deviceIds = devicesToUpdate.map(device => device._id);
  for (const device of devicesToUpdate) {
    io.emit('buttonState', { status, pinEsp: device.pinEsp });
  }
  await Device.updateMany({ _id: { $in: deviceIds } }, { status, dayRunningStatus: status });
  devicesToUpdate.forEach(async device => {
    device.countOn++;
    await device.save();
  });
  deviceController.getListDevicesRunning({ homeId: devicesToUpdate[0].homeId }, io);
};
const deviceController = {
  // nguyen
  getLists: async (data, io, socket) => {
    const { _id, roomId } = data;
    try {
      const room = await Room.findById(roomId).populate('devicesId');
      io.to(data._id).emit('listDevices', room);
    } catch (error) {
      console.error(error);
    }
  },
  getListforHome: async (data, io, socket) => {
    const { _id, homeId } = data;
    try {
      const device = await Device.find({ homeId: homeId }).lean();
      io.to(data._id).emit('getListforHome', device);
    } catch (error) {
      console.error(error);
    }
  },
  getList: async (dataDevice, io, socket) => {
    const { homeId, roomId, uid } = dataDevice;
    try {
      const room = await Room.findById(roomId).populate('devicesId');
      io.emit(`listDevice${uid}`, room.devicesId);
    } catch (error) {
      console.error(error);
    }
  },

  getListDevicesRunning: async (dataDevice, io, socket) => {
    const { homeId } = dataDevice;
    try {
      const devices = await Device.find({ homeId: homeId, status: true }).lean();
      io.to(homeId).emit("getDeviceRunning", devices);
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

      await io.to(homeId).emit('createDevice', devices);
      await roomController.getList(deviceData, io, socket);
    } catch (error) {
      console.error(error);
    }
  },

  updateOnOff: async (dataDevice, io, socket) => {
    const { idDevice, status, homeId, pinEsp, uid } = dataDevice;
    io.emit('buttonState', { status: status, pinEsp: pinEsp })

    try {
      const device = await Device.findById(idDevice);

      let countOn = device.countOn;
      if (status && countOn !== undefined) {
        countOn++;
      }

      const deviceUpdate = await Device.findByIdAndUpdate(idDevice, { status: status, countOn: countOn});

      io.to(homeId).emit('deviceUpdated', { idDevice: deviceUpdate._id, status: status });

      deviceController.getListDevicesRunning(dataDevice, io, socket)
      deviceController.getListDeviceTime(dataDevice, io, socket);
      deviceController.reportDataDevice(dataDevice, io, socket);

    } catch (error) {
      console.error(error);
    }
  },

  deleteDevice: async (deviceData, io, socket) => {
    const { deviceId, homeId, roomId } = deviceData;
    try {
      const deletedDevice = await Device.findByIdAndDelete(deviceId);
      await Room.findOneAndUpdate(
        { _id: roomId },
        { $pull: { devicesId: deviceId } }
      );

      // await deviceController.getList(deviceData, io, socket);
      // await roomController.getList(deviceData, io, socket);

      io.to(homeId).emit('deleteDevice', deletedDevice._id)
      await deviceController.getListDevicesRunning(deviceData, io, socket);
      await roomController.getList(deviceData, io, socket);
      await deviceController.getListDeviceTime(deviceData, io, socket)
    } catch (error) {
      console.error(error);
    }
  },

  getDropDownList: async (homeId, io, socket) => {
    try {
      const devices = await Device.find({
        $and: [
          { homeId: homeId },
          { $or: [{ timeOn: null }, { timeOff: null }, { dayRunning: [] }] },
        ],
      })
        .populate('roomId', 'nameRoom homeId')
        .select('nameDevice roomName iconName roomId status')
        .lean()
        .sort({ roomId: 1 });

      // Chuyển đổi dữ liệu để tạo ra mảng options
      const options = [];
      let prevParent = null;

      devices.forEach(device => {
        const parent = device.roomName || null;
        if (parent !== prevParent) {
          options.push({ label: parent, value: parent, disabled: true });
          prevParent = parent;
        }
        options.push({
          label: device.nameDevice,
          value: device._id,
          parent: parent
        });
      });

      io.to(homeId).emit('optionsList', options);
    } catch (error) {
      console.error(error);
    }
  },

  updateDeviceOnOff: async (dataDevice, io, socket) => {
    const { dayRunning, timeOn, timeOff, deviceId } = dataDevice;
    const updateData = {
      timeOn: timeOn,
      timeOff: timeOff,
      dayRunning: dayRunning,
      dayRunningStatus: true
    };

    try {
      await Device.updateMany({ _id: { $in: deviceId } }, updateData, { new: true });
      await deviceController.getListDeviceTime(dataDevice, io, socket);
    } catch (error) {
      console.error('Error updating devices:', error);
    }
  },

  deleteScheduleOnOff: async (dataDevice, io, socket) => {
    const { idDevice, homeId } = dataDevice;
    const updateData = {
      timeOn: null,
      timeOff: null,
      dayRunning: []
    };

    try {
      await Device.findOneAndUpdate({ _id: idDevice }, updateData, { new: true });
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

      io.to(homeId).emit('getListSchedule', devices);
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
  },
  createDeviceQrCode: async (dataDevice, io, socket) => {

    const { nameDevice, iconName, homeId, roomName, pinEsp, roomId, uid } = dataDevice;

    try {
      // Check if a device with the same homeId and pinEsp already exists
      const existingDevice = await Device.findOne({ homeId, pinEsp });
      if (existingDevice) {
        console.log(`A device with homeId ${homeId} and pinEsp ${pinEsp} already exists`);
        io.emit(`qrScanFailed${uid}`, `This device is added to the ${existingDevice.roomName}`)
        return; // Exit function early without creating a new device
      }

      // const user = await User.findOne({ uid: uid }).populate('homeId');
      const room = await Room.findById(roomId);
      const device = new Device({ nameDevice, iconName, roomName, pinEsp, roomId, homeId });
      room.devicesId.push(device._id);
      await room.save();
      await device.save();
      // Gửi thông tin của phòng mới được thêm vào
      io.to(homeId).emit("createDeviceQR", device);
      await roomController.getList(dataDevice, io, socket);
    } catch (error) {
      console.error(error);
    }
  },

  updateDeviceStatusBySchedule: async (io) => {
    try {
      const currentDateTime = moment().tz('Asia/Ho_Chi_Minh');
      const devices = await Device.find({
        $and: [
          { timeOn: { $ne: null } },
          { timeOff: { $ne: null } },
          {
            dayRunning: {
              $in: [
                currentDateTime.format('ddd'),
                'everyday'
              ]
            }
          }
        ]
      });

      const devicesToUpdateOn = devices.filter(device => {
        const format = 'YYYY-MM-DD hh:mm A'; // Update the format to include date
        const timeZone = 'Asia/Ho_Chi_Minh';
        const currentDate = moment.tz(currentDateTime, timeZone).format('YYYY-MM-DD');
        const timeOn = moment.tz(`${currentDate} ${device.timeOn}`, format, timeZone);
        const timeOff = moment.tz(`${currentDate} ${device.timeOff}`, format, timeZone);
        const dayRunning = device.dayRunning.includes('everyday') || device.dayRunning.includes(currentDateTime.format('ddd'));

        return moment(currentDateTime).isBetween(timeOn, timeOff, null, '[]') && dayRunning && device.dayRunningStatus;
      });// Make sure filterDevices also use moment.tz()
      const devicesToUpdateOff = devices.filter(device => {
        const format = 'YYYY-MM-DD hh:mm A'; // Update the format to include date
        const timeZone = 'Asia/Ho_Chi_Minh';
        const currentDate = moment.tz(currentDateTime, timeZone).format('YYYY-MM-DD');
        const timeOff = moment.tz(`${currentDate} ${device.timeOff}`, format, timeZone);
        const dayRunning = device.dayRunning.includes('everyday') || device.dayRunning.includes(currentDateTime.format('ddd'));

        return currentDateTime.isAfter(timeOff) && dayRunning && device.dayRunningStatus;
      });

      if (devicesToUpdateOn.length > 0) {
        await emitButtonStateAndSave(devicesToUpdateOn, io, true);
      }

      if (devicesToUpdateOff.length > 0) {
        await emitButtonStateAndSave(devicesToUpdateOff, io, false);
      }
    } catch (error) {
      console.error('Error updating device status by schedule:', error);
    }
  },

  reportDataDevice: async (data, io) => {
    const { homeId } = data;
    const devices = await Device.find({ homeId: homeId });
    const labelsArray = devices.map(device => {
      const firstLetter = device.nameDevice.charAt(0).toUpperCase();
      const secondLetter = device.roomName.charAt(0).toUpperCase();
      return `${firstLetter}-${secondLetter}`;
    });
    const countOnArray = devices.map(device => device.countOn);
    const consumesArray = devices.map(device => device.consumes);

    const chartData = [{ labels: labelsArray, data: countOnArray }, { labels: labelsArray, data: consumesArray }];

    io.to(homeId).emit('reportData', chartData)
  },

  updateDeviceOnOffEsp: async (data, io, socket) => {
    const { homeId, pinEsp, status } = data;
    console.log(data)
    const deviceUpdate = await Device.findOneAndUpdate({ pinEsp: pinEsp, homeId: homeId }, { status: status })
    deviceController.getListDevicesRunning(data, io, socket)

    socket.to(homeId).emit('deviceUpdated', { idDevice: deviceUpdate._id, status: status });
  },


  resetDeviceState: async (data, io) => {
    const { homeId, pinsEsp, statuss } = data;
    await pinsEsp.forEach(async pinEsp => {
      await Device.findOneAndUpdate({ pinEsp: pinEsp }, { status: false })
    });
    deviceController.getListDevicesRunning({ homeId: homeId }, io)
  },
  updateConsumes: async (data, io) => {
    const { homeId, consumes, pinEsp } = data;
    let resultConsume = Math.round((consumes * 100)/100)

    try {
      const updatedDevice = await Device.findOneAndUpdate(
        { homeId: homeId, pinEsp: pinEsp },
        { $inc: { consumes: resultConsume } },
        { new: true }
      );

      if (!updatedDevice) {
        console.error('No device found to update');
      }
    } catch (error) {
      console.error('Error updating device consumes:', error);
    }
  }
};

module.exports = deviceController;