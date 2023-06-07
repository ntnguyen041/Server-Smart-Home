const Device = require('../model/device.model');

const deviceController = {
  getList: async (req, res) => {
    const { roomId } = req;
    try {
      const devices = await Device.find({ roomId });
      // res.json(devices);
    } catch (error) {
      console.log(error);
      // res.status(500).json({ message: 'Internal server error' });
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

  createDevice: async (req, res) => {
    const { name, userId } = req;
    const newDevice = new Device({ name, userId });
    try {
      const savedDevice = await newDevice.save();
      console.log(savedDevice)
    } catch (error) {
      console.log(error);
      // res.status(500).json({ message: 'Internal server error' });
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

  deleteDevice: async (req, res) => {
    const { deviceId } = req.params;
    try {
      const device = await Device.findByIdAndDelete(deviceId);
      if (!device) {
        return res.status(404).json({ message: 'Device not found' });
      }
      res.json(device);
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
};

module.exports = deviceController;