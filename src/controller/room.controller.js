const Room = require('../model/room.model');
const Home = require('../model/home.model');
const User = require('../model/user.model');
const Device = require('../model/device.model');
// const deviceController = require('./device.controller');

const roomController = {
  getList: async (data, io, socket) => {
    try {
      const { homeId } = data;
      const home = await Home.findById(homeId).populate('roomId');
      if (home)
        io.to(homeId).emit("listRoom", home.roomId);
    } catch (error) {
      console.error(error);
    }
  },
  selectRoom: async (data, io, socket) => {
    try {
      const { homeId, uid } = data;
      const home = await Home.findById(homeId).populate('roomId');
      io.to(homeId).emit("selectListRoom", home.roomId);
    } catch (error) {
      console.log(error);
    }
  },

  createRoom: async (roomData, io, socket) => {
    const { nameRoom, imageRoom, homeId, uid } = roomData;
  
    try {
      const home = await Home.findById(homeId);
  
      const room = new Room({ nameRoom, imageRoom });
  
      home.roomId.push(room._id);
  
      // Use Promise.all to save both documents at the same time
      await Promise.all([home.save(), room.save()]);
  
      // Emit the new room's info
      io.to(homeId).emit("createRoom", room);
      // await roomController.getList(roomData, io, socket);
    } catch (error) {
      console.error(error);
    }
  },

  deleteRoom: async (roomData, io, socket) => {
    const { homeId, roomId, uid } = roomData;

    try {
      const deletedRoom = await Room.findById(roomId);

      await Device.deleteMany({ roomId: roomId });
      await Home.findOneAndUpdate(
        { roomId: roomId },
        { $pull: { roomId: roomId } },
        { new: true }
      );

      await roomController.getList(roomData, io, socket);
      io.to(homeId).emit('deleteRoom', deletedRoom._id);

      const devices = await Device.find({ homeId: homeId, status: true }).lean();
      io.to(homeId).emit("getDeviceRunning", devices);

    } catch (error) {
      console.error(error);
    }
  },
  updateRoom: async (roomData, io, socket) => {

    try {
      const { idRoom, imageRoom, nameRoom, homeId } = roomData;
      await Room.findByIdAndUpdate(idRoom, { imageRoom: imageRoom, nameRoom: nameRoom });

      roomController.getList(roomData, io, socket);

    } catch (error) {
      console.log(error);
    }
  }
};

module.exports = roomController;