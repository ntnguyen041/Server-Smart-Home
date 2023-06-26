const User = require('../model/user.model');
const Home = require('../model/home.model')

const getAllUsers = async (userData, io, socket) => {
  const { _id } = userData;
  await User.find()
    .then((users) => {
      io.to(_id).emit('listUserView', users);
    })
    .catch((err) => {
      console.error(err);
    });
};

//////////////login admin
const login = (phoneNumber, io) => {
  User.findOne({phoneUser: phoneNumber})
    .then((users) => {
      io.to(phoneNumber).emit('loginAD', users);
    })
    .catch((err) => {
      console.error(err);
    });
};
//lay 1 user
const getUser = (data, io) => {
  const _id = data._id;
  User.findOne({_id: _id})
    .then((users) => {
      io.to(_id).emit('getUser', users);
    })
    .catch((err) => {
      console.error(err);
    });
};
// Lấy danh sách user từ MongoDB và gửi về client
const getUsers = (data, io) => {
  const { uid } = data;
  User.findOne({ uid: uid })
    .then((users) => {
      io.emit('listUser', users);
    })
    .catch((err) => {
      console.error(err);
    });
};

// Tạo user mới và lưu vào MongoDB
const createUser = async (userData, io) => {
  try {
    const { uid, nameUser, phoneUser, imageUser, nameHome } = userData;
    const home = new Home({ nameHome })
    await home.save();
    const user = new User({ uid, nameUser, phoneUser, imageUser });
    user.homeId.push(home._id)
    await user.save();
  } catch (error) {
    console.error(error);
    throw new Error("Error creating user");
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


module.exports = {login,getUser, getAllUsers, getUsers, createUser, updateUser, deleteUser, updateRoom };

