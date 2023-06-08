const Room = require('../model/room.model');
const Home = require('../model/home.model');
const User = require('../model/user.model');

const homeController = require('../controller/home.controller')


const roomController = {
  getList: async (req, res) => {
    try {
      const rooms = await Room.find().populate('deviceId');
      res.json(rooms);
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: 'Internal server error' });
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

  createRoom: async (roomData, io) => {
    const { nameRoom, imageRoom, uid } = roomData;

    User.findOne({ uid: uid })
      .populate('homeId')
      .then((users) => {
        const hoomId = users.homeId[0]._id.toString();
        const room = new Room({ nameRoom, imageRoom });

        Home.findById(hoomId)
          .then(async (home) => {
            home.roomId.push(room._id);
            await home.save();
          })
          .then(async (home) => {
            await room.save();
            await homeController.getList(io);
          })
          .catch((err) => {
            console.error(err);
          });
      })
      .catch((err) => {
        console.error(err);
      });
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

  deleteRoom: async (req, res) => {
    const { roomId } = req.params;
    try {
      const room = await Room.findByIdAndDelete(roomId);
      if (!room) {
        return res.status(404).json({ message: 'Room not found' });
      }
      res.json(room);
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
};

module.exports = roomController;