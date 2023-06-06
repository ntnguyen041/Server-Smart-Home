const User = require('../model/user.model');

// Lấy danh sách user từ MongoDB và gửi về client
const getUsers = (socket) => {
  User.find({})
    .then((users) => {
      socket.emit('users', users);
    })
    .catch((err) => {
      console.error(err);
    });
};

// Tạo user mới và lưu vào MongoDB
const createUser = async (userData, io) => {
  try {
    const user = new User(userData);
    await user.save();
    io.emit('userCreated', user);
  } catch (error) {
    console.error(error);
  }
};

// Cập nhật user và lưu vào MongoDB
const updateUser = async (userData, io) => {
  try {
    const user = await User.findByIdAndUpdate(userData._id, userData, {
      new: true,
    });
    io.emit('userUpdated', user);
  } catch (error) {
    console.error(error);
  }
};

// Xóa user và xóa khỏi MongoDB
const deleteUser = async (userId, io) => {
  try {
    const user = await User.findByIdAndDelete(userId);
    io.emit('userDeleted', user);
  } catch (error) {
    console.error(error);
  }
};

const updateRoom = async (userId, io) => {
  // Cập nhật trường room của user có _id là userId
  try {
    const result = await User.updateOne({ _id: userId }, { $set: { room: "1234" } });
    console.log('Updated user:', result);
  } catch (err) {
    console.log(err);
  }

}

module.exports = { getUsers, createUser, updateUser, deleteUser, updateRoom };