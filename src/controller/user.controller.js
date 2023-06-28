

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

const userController = {
  getAllUsers:async (userData, io, socket) => {
    const _id= userData;
    await User.find()
      .then((users) => {
        io.to(_id).emit('listUserView', users);
      })
      .catch((err) => {
        console.error(err);
      });
  },
  //////////////login admin
   login:async(phoneNumber, io) => {
    User.findOne({phoneUser: phoneNumber})
      .then((users) => {
        io.to(phoneNumber).emit('loginAD', users);
      })
      .catch((err) => {
        console.error(err);
      });
  },
  //lay 1 user
  getUser:async (data, io) => {
    const _id = data._id;
    User.findOne({_id: _id})
      .then((users) => {
        io.to(_id).emit('getUser', users);
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
  createUser: async (userData, io) => {
    try {
      const { uid, nameUser, phoneUser, imageUser, nameHome } = userData;
      const home = new Home({ nameHome })
      await home.save();
      const user = new User({ uid, nameUser, phoneUser, imageUser });
      user.homeId.push(home._id)
      await user.save();
      io.to(uid).emit("homeCreated", home._id);
    } catch (error) {
      console.error(error);
      throw new Error("Error creating user");
    }
  },

  // Cập nhật user và lưu vào MongoDB
  updateUser: async (userData, io, socket) => {
    const { uid, imageUser, nameUser, mailUser } = userData
    try {
      const updatedUser = await User.findByIdAndUpdate(uid, { nameUser, imageUser, mailUser }, { new: true });
      socket.to(uid).emit('users', updatedUser);
    } catch (error) {
      console.error('Error updating user:', error);
    }
  },

  // Xóa user và xóa khỏi MongoDB
  deleteUser: async (userId, io) => {
    try {
      const user = await User.findByIdAndDelete(userId);
      io.emit('userDeleted', user);
    } catch (error) {
      console.error(error);
    }
  },

  updateRoom: async (userId, io) => {
    // Cập nhật trường room của user có _id là userId
    try {
      const result = await User.updateOne({ _id: userId }, { $set: { room: "1234" } });
      console.log('Updated user:', result);
    } catch (err) {
      console.log(err);
    }
  },

  // loginUser: async (phoneNumber, io) => {
  //   // console.log(phoneNumber)
  //   const auth = FirebaseAdmin.auth();
  //   auth.signInWithPhoneNumber(phoneNumber)
  //     .then((result) => {
  //       const token = result._tokenResponse.providerId + ' ' + result._tokenResponse.accessToken;
  //       socket.emit('login', { token });
  //     })
  //     .catch((error) => {
  //       console.error(error);
  //       // return res.status(500).send('Error while signing in');
  //     });
  //   // try {
  //   //   // Kiểm tra xem người dùng đã tồn tại trong database hay chưa
  //   //   let user = await User.findOne({ phoneUser: phoneNumber });

  //   //   // // Tạo một số ngẫu nhiên từ 0 đến 999999
  //   //   let randomNumber = Math.floor(Math.random() * 1000000);

  //   //   // // Chuyển đổi số thành một chuỗi có 6 chữ số bằng cách thêm các số 0 vào đầu
  //   //   let formattedNumber = String(randomNumber).padStart(6, '0');

  //   //   if (!user) {
  //   //     // Nếu người dùng chưa tồn tại, tạo mới một người dùng với số điện thoại và mã OTP mới
  //   //     const userDataNew = {
  //   //       nameUser: makeId(10),
  //   //       phoneUser: phoneNumber,
  //   //       otp: formattedNumber,
  //   //     }
  //   //     const home = new Home({ nameHome: makeId(10) })
  //   //     await home.save();

  //   //     user = new User(userDataNew);
  //   //     user.homeId.push(home._id)

  //   //     await user.save();
  //   //   } else {
  //   //     // Nếu người dùng đã tồn tại, cập nhật mã OTP mới
  //   //     user.otp = formattedNumber;
  //   //     await user.save();
  //   //   }

  //   //   // Gửi mã OTP qua SMS
  //   //   await client.messages.create({
  //   //     body: `Your OTP is ${formattedNumber}`,
  //   //     from: fromNumber,
  //   //     to: phoneNumber
  //   //   });

  //   //   // Gửi thông báo đến client rằng mã OTP đã được gửi
  //   //   io.emit('otpSent', 'success');
  //   // } catch (error) {
  //   //   console.log(error);
  //   //   //   res.status(500).send({ error: 'Có lỗi xảy ra khi gửi mã OTP' });
  //   // }
  // },

  // verifi: async (data, io) => {
  //   const { phoneUser, verificationId, verificationCode } = data;

  //   const admin = require('firebase-admin');
  //   const serviceAccount = require('../firebaseAccountKey/serviceAccountKey.json');
  //   admin.initializeApp({
  //     credential: admin.credential.cert(serviceAccount),
  //     databaseURL: "https://smarthomereactnative-default-rtdb.firebaseio.com",
  //   });

  //   // Sử dụng Firebase Admin SDK để xác thực số điện thoại của người dùng
  //   const credential = admin.auth.signInWithEmailAndPassword("adsf", "asdf")
  //   console.log(credential)
  //   // await admin.auth().signInWithCredential(credential)
  //   //   .then((userCredential) => {
  //   //     // Nếu xác thực thành công, trả về mã thông báo đại diện cho người dùng đó
  //   //     const token = userCredential.user.uid;
  //   //     console.log(token)
  //   //   })
  //   //   .catch((error) => {
  //   //     console.error(error);
  //   //   });
  // }
}

module.exports = userController;