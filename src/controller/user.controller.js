

const User = require('../model/user.model');
const Home = require('../model/home.model')


const twilio = require('twilio');

const accountSid = 'AC658554c833859d8a4d48f27de29f3de7'; // Thay đổi giá trị này thành Account SID của bạn
const authToken = '070f40fc1055cc8e93e4f06b39b36dfe'; // Thay đổi giá trị này thành Auth Token của bạn
const fromNumber = '+14175283361'; // Thay đổi giá trị này thành số điện thoại Twilio của bạn

const client = twilio(accountSid, authToken);

function makeId(length) {
  let result = "";
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const charactersLength = characters.length;
  let counter = 0;
  while (counter < length) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
    counter += 1;
  }
  return result;
}
// nguyen
const userController = {
  login: async (phoneNumber, io) => {
    User.findOne({ phoneUser: phoneNumber })
      .then((users) => {
        io.emit('loginAD', users);
      })
      .catch((err) => {
        console.error(err);
      });
  },
  /// trong 1 nha //nguyen
  getlistUser: async (data, io) => {
    const { uid, homeId } = data;
    User.find({ homeId: homeId })
      .then((users) => {
        if (users != null) {
          io.emit('listUserView', users);
        }
      })
      .catch((err) => {
        console.error(err);
      });
  },

  getUserLogin: async (data, io) => {
    try {
      const { uid } = data;
      User.findOne({ uid: uid })
        .then((users) => {
          io.emit(`getUserLogin${uid}`, users.homeId[0]);
        })
        .catch((err) => {
          console.error(err);
        });
    } catch (err) {
      console.log(err)
    }
  },

  getUser: async (dataUser, io) => {
    const { uid, homeId } = dataUser;
    User.findOne({ uid: uid })
      .then((users) => {
        io.emit(`getUser${uid}`, users);
      })
      .catch((err) => {
        console.error(err);
      });
  },
  getUsers: async (userData, io) => {
    const { uid } = userData;
    User.findOne({ uid: uid })
      .then((users) => {
        io.to(uid).emit('users', users);
      })
      .catch((err) => {
        console.error(err);
      });
  },
  // Tạo user mới và lưu vào MongoDB
  // createUser: async (userData, io) => {
  //   try {
  //     const { uid, nameUser, phoneUser, imageUser, nameHome } = userData;
  //     const home = new Home({ nameHome, uid })
  //     await home.save();
  //     const user = new User({ uid, nameUser, phoneUser, imageUser });
  //     user.homeId.push(home._id)
  //     await user.save();
  //     io.to(uid).emit("homeCreated", home._id);
  //   } catch (error) {
  //     console.error(error);
  //     throw new Error("Error creating user");
  //   }
  // },

  // Cập nhật user và lưu vào MongoDB

  createUser: async (userData, io) => {
    try {
      const { uid, nameUser, phoneUser, imageUser, nameHome } = userData;

      const home = new Home({ nameHome, uid });
      const user = new User({ uid, nameUser, phoneUser, imageUser });

      user.homeId.push(home._id);

      // Save both documents at the same time
      await Promise.all([home.save(), user.save()]);

      io.to(uid).emit("homeCreated", home._id);
    } catch (error) {
      console.error(error);

      // Send specific error message
      throw new Error(`Error creating user: ${error.message}`);
    }
  },

  updateUser: async (userData, io, socket) => {
    const { uid, imageUser, nameUser, mailUser, nameHome, homeId, _id } = userData
    try {
      const updatedUser = await User.findByIdAndUpdate(_id, { nameUser, imageUser, mailUser }, { new: true });
      const updatedHome = await Home.findByIdAndUpdate(homeId, { nameHome }, { new: true });
      socket.emit(`updateUser${uid}`, updatedUser);
      socket.emit(`updateHome${uid}`, updatedHome)
    } catch (error) {
      console.error('Error updating user:', error);
    }
  },


  addHoomToUser: async (data, io) => {
    try {
      const { numberPhone, homeId } = data;


      const filter = { phoneUser: numberPhone };
      const update = { $addToSet: { homeId: homeId } };
      const options = { new: true };

      const updatedUser = await User.findOneAndUpdate(filter, update, options);
      if (!updatedUser) {
        return;
      }

      const home = await Home.findById(homeId);
      const { _id, nameHome } = home;
      const list = {
        label: nameHome,
        value: _id,
      };
      io.emit(`addDropDownHome${updatedUser.uid}`, list);
    } catch (error) {
      console.error(error);
    }
  },
  listUserToRoomId: async (data, io) => {
    const { uid } = data;
    let arr = [];

    const homes = await Home.find({ uid: uid }).select('_id nameHome');

    const arrPromises = homes.map(async item => {
      const users = await User.find({ homeId: item._id });
      const filteredUsers = users.filter(user => user.uid !== uid);
      const list = {
        id: item._id,
        nameHome: item.nameHome,
        user: filteredUsers,
      };
      return list;
    });

    arr = await Promise.all(arrPromises);

    io.emit(`listUserToRoomId${uid}`, arr);
  },

  deleteUserToRoomId: async (data, io) => {
    const { id, homeId } = data;
    const filter = { _id: id };
    const update = { $pull: { homeId: homeId } };
    const options = { new: true };
    const updatedUser = await User.findOneAndUpdate(filter, update, options);
    const home = await Home.findById(homeId).select('_id nameHome')
    const homeIds = updatedUser.homeId;
    const promises = homeIds.map(async (id) => {
      try {
        const room = await Home.findById(id);
        if (!room) {
          return null; // Skip null values
        }
        return { label: room.nameHome, value: room._id };
      } catch (error) {
        console.error(error);
        return null;
      }
    });
    const rooms = await Promise.all(promises);
    const arrDropDown = rooms.filter((room) => room !== null);

    io.emit(`updateDropDownHome${updatedUser.uid}`, { arrDropDown, home })
    // io.emit(`weather${updatedUser.uid}`, { weather: [] })
    userController.listUserToRoomId(data, io)
  },

  sendTokenDeviceToEsp: async (token, io) => {
    console.log(token)
  },
}

module.exports = userController;