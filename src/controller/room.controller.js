const Room = require('../model/room.model');
const Home = require('../model/home.model');
const User = require('../model/user.model');
const Device = require('../model/device.model');
const homeController = require('../controller/home.controller');

const roomController = {
  getList: async (data, io, socket) => {
    try {
      const { homeId, uid } = data;
      const home = await Home.findById(homeId).populate('roomId');
      io.to(uid).emit("listRoom", home.roomId);
    } catch (error) {
      console.log(error);
    }
  },

  getDetail: async (req, res) => {
    const { roomId } = req.params;
    try {
      const room = await Room.findById(roomId).populate('devices');
      if (!room) {
        return res.status(404).json({ message: 'Room not found' });
      }
      res.json(room);
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: 'Internal server error' });
    }
  },

  createRoom: async (roomData, io, socket) => {
    const { nameRoom, imageRoom, uid, homeId } = roomData;
    try {
      const user = await User.findOne({ uid: uid }).populate('homeId');
      const home = user.homeId[0];
      const room = new Room({ nameRoom, imageRoom });
      home.roomId.push(room._id);
      await home.save();
      await room.save();
      await roomController.getList(homeId, io, socket);
    } catch (error) {
      console.error(error);
    }
  },

  updateRoom: async (req, res) => {
    const { roomId } = req.params;
    const { name } = req.body;
    try {
      const room = await Room.findByIdAndUpdate(roomId, { name }, { new: true });
      if (!room) {
        return res.status(404).json({ message: 'Room not found' });
      }
      res.json(room);
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: 'Internal server error' });
    }
  },

  deleteRoom: async (roomData, io, socket) => {
    const { homeId, roomId } = roomData;

    try {
      // Xóa phòng
      await Room.findByIdAndDelete(roomId);

      // Xóa tất cả các thiết bị liên quan đến phòng
      await Device.deleteMany({ roomId: roomId });

      // Cập nhật tài liệu home
      await Home.findOneAndUpdate(
        { roomId: roomId },
        { $pull: { roomId: roomId } },
        { new: true }
      );

      await roomController.getList(homeId, io, socket);
    } catch (error) {
      console.error(error);
    }
  }
};

module.exports = roomController;