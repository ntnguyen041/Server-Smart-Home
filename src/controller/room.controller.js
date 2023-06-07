const Room = require('../model/room.model');

const roomController = {
  getList: async (req, res) => {
    try {
      const rooms = await Room.find().populate('devices');
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

  createRoom: async (req, res) => {
    const { nameRoom, homeID } = req;
    console.log(nameRoom, homeID)
    const newRoom = new Room({ nameRoom, homeID});
    console.log(newRoom)
    try {
      const savedRoom = await newRoom.save();
      // res.json(savedRoom);
    } catch (error) {
      console.log(error);
      // res.status(500).json({ message: 'Internal server error' });
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