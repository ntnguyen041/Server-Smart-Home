const express = require("express");
const mongoose = require('mongoose');
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");
const userController = require('./controller/user.controller')
const roomController = require('./controller/room.controller')
const deviceController = require('./controller/device.controller')
const homeController = require('./controller/home.controller')
require('dotenv').config();
const User = require('./model/user.model')

const app = express();
var port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const server = http.createServer(app);
mongoose.connect(process.env.URL_MONGO, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
    .then(() => console.log('Connected to MongoDB'))
    .catch((err) => console.error('Could not connect to MongoDB', err));
    // `http://localhost:3000`, 
const io = new Server(server, {
    cors: {
        origin: [`http://localhost:3000`],
        methods: ["GET", "POST"],
    },
});


io.on("connection", (socket) => {

    socket.on('getData', async uid => {
        try {
            const user = await User.findOne({ uid: uid }).populate({
                path: 'homeId',
                populate: {
                    path: 'roomId',
                    populate: {
                        path: 'devicesId'
                    }
                }
            });

            //   // Lấy tất cả các thiết bị và chỉ lấy các thiết bị có trạng thái là true
            //   const allDevicesRunning = user.homeId.reduce((acc, home) => {
            //     const rooms = home.roomId.map(room => room.devicesId);
            //     const devices = rooms.flat().filter(device => device.status === true);
            //     return [...acc, ...devices];
            //   }, []);

            //   // Chia dữ liệu thành các đối tượng cần thiết
            //   const data = user.homeId.reduce((acc, home) => {
            //     const rooms = home.roomId.map(room => {
            //       const devices = room.devicesId.filter(device => device.status === true);
            //       return {
            //         id: room.id,
            //         name: room.nameRoom,
            //         devices: devices.map(device => ({
            //           id: device.id,
            //           name: device.nameDevice,
            //           status: device.status
            //         }))
            //       };
            //     });
            //     acc.homes.push({
            //       id: home.id,
            //       name: home.nameHome,
            //       rooms: rooms
            //     });
            //     return acc;
            //   }, {
            //     user: {
            //       id: user.id,
            //       name: user.nameUser,
            //       phone: user.phoneUser,
            //       image: user.imageUser,
            //       mail: user.mailUser
            //     },
            //     homes: []
            //   });

            //   // Thêm tất cả các thiết bị và chỉ lấy các thiết bị có trạng thái là true vào đối tượng data
            //   data.allDevicesRunning = allDevicesRunning.map(device => ({
            //     _id: device.id,
            //     nameDevice: device.nameDevice,
            //     status: device.status
            //   })).filter(device => device.status === true);


            const devices = user.homeId[0].roomId.flatMap(room => (
                room.devicesId.filter(device => device.status)
            ));

            io.to(uid).emit('devicesRunning', devices);
            io.to(uid).emit('rooms', user.homeId[0].roomId)
        } catch (error) {
            console.error(error);
        }
    });

    console.log(`User connect: ${socket.id}`);

    socket.on('joinRoom', token => {
        socket.join(token);
    })

    socket.on('loginadmin', (data)=>{
         userController.login(data, io);
       
    })

    socket.on("disconnect", () => {
        console.log(`User disconnect: ${socket.id}`)
    });

    socket.on("getOneUser",async(data)=>{
        userController.getUser(data,io);
    })
    // User
    socket.on('getAllUser', async (userData) => {
        userController.getAllUsers(userData, io, socket);
    });
    socket.on('getUser', async (uid) => {
        userController.getUsers(uid, io, socket);
    });
    socket.on('createUser', async (userData) => {
        userController.createUser(userData, io, socket);
    });

    socket.on('updateUser', async (userData) => {
        userController.updateUser(userData, io, socket);
    });

    socket.on('deleteUser', async (userId) => {
        userController.deleteUser(userId, io, socket);
    });

    //Room
    socket.on('getRoomLists', async (homeId) => {
        roomController.getListRoom(homeId, io, socket);
    });

    socket.on('getRoomList', async (homeId) => {
        roomController.getList(homeId, io, socket);
    });

    socket.on('createRoom', async (roomData) => {
        roomController.createRoom(roomData, io, socket);
    });

    socket.on('updateRoom', async (roomData) => {
        roomController.updateRoom(roomData, io, socket);
    });

    socket.on('deleteRoom', async (roomId) => {
        roomController.deleteRoom(roomId, io, socket);
    });



    // Device
    socket.on('createDevice', async (deviceData) => {
        deviceController.createDevice(deviceData, io, socket);
    });

    socket.on('getDevice', async (deviceData) => {
        deviceController.getList(deviceData, io, socket);
    });

    socket.on('updateOnOff', async (dataDevice) => {
        deviceController.updateOnOff(dataDevice, io, socket);
    })

    socket.on('getDeviceRunning', async (homdId) => {
        deviceController.getListDevicesRunning(homdId, io, socket);
    })
    socket.on('deleteDevice', async (deivceData) => {
        deviceController.deleteDevice(deivceData, io, socket);
    })

    socket.on('listDeviceDropDown', (dataDevice) => {
        deviceController.getDropDownList(dataDevice, io, socket);
    })

    socket.on('updateDeviceOnOff', async (deivceData) => {
        deviceController.updateDeviceOnOff(deivceData, io, socket);
    })

    socket.on('getListDeviceTime', async (dataDevice) => {
        deviceController.getListDeviceTime(dataDevice, io, socket);
    })

    socket.on('updateScheduleOnOff', async (deviceData) => {
        deviceController.updateScheduleOnOff(deviceData, io, socket);
    })
    socket.on('deleteScheduleOnOff', async (deviceData) => {
        deviceController.deleteScheduleOnOff(deviceData, io, socket);
    })

    // Home
    socket.on('createHome', async (homeData) => {
        homeController.createHome(homeData, io, socket);
    });
    socket.on("getitemhome",async(data)=>{
        homeController.getList(data, io, socket)
    })

});

server.listen(port, () => {
    console.log(`Server is running on port http://localhost:${port}`);
});