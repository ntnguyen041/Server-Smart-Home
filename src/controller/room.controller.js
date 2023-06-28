const Room = require('../model/room.model');
const Home = require('../model/home.model');
const User = require('../model/user.model');
const Device = require('../model/device.model');
const homeController = require('../controller/home.controller');

const roomController = {
  getList: async (data, io, socket) => {
    console.log(data)
    try {
      const { homeId, uid } = data;
      const home = await Home.findById(homeId).populate('roomId');
      io.to(homeId).emit("listRoom", home.roomId);
    } catch (error) {
      console.log(error);
    }
  },

  createRoom: async (roomData, io, socket) => {
    const { nameRoom, imageRoom, homeId, uid } = roomData;
    try {
      // const user = await User.findOne({ uid: uid }).populate('homeId');
      const home = await Home.findById(homeId);
      const room = new Room({ nameRoom, imageRoom });
      home.roomId.push(room._id);
      await home.save();
      await room.save();
      // Gửi thông tin của phòng mới được thêm vào
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
      await Room.findByIdAndDelete(roomId);
      await Device.deleteMany({ roomId: roomId });
      await Home.findOneAndUpdate(
        { roomId: roomId },
        { $pull: { roomId: roomId } },
        { new: true }
      );

      // await roomController.getList(roomData, io, socket);
      io.to(homeId).emit('deleteRoom', deletedRoom._id);
    } catch (error) {
      console.error(error);
    }
  }
};

module.exports = roomController;