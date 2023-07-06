const express = require("express");
const mongoose = require('mongoose');
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");
const userController = require('./controller/user.controller')
const roomController = require('./controller/room.controller')
const deviceController = require('./controller/device.controller')
const homeController = require('./controller/home.controller')
const Device = require('./model/device.model')

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
        origin: [`https://smarthome-ckc.onrender.com`],
        methods: ["GET", "POST"],
    },
});


io.on("connection", (socket) => {

    console.log(`User connect: ${socket.id}`);



    socket.on('DataSensor', data => {
        io.emit('DataSensor', data)
    })

    socket.on('loginadmin', (data) => {
        userController.login(data, io);
    })// nguyen
    socket.on('joinRoom', token => {
        socket.join(token);
        const room = io.sockets.adapter.rooms.get(token);
        if (room) {
            const clients = [...room.values()];
            socket.to(token).emit('socketJoinId', clients[0])
        } else {
            console.log("Phòng không tồn tại.");
        }
    })
    socket.on('joinRoomSelect', token => {
        socket.join(token.homeId);
        const socketToRemove = io.sockets.sockets.get(socket.id);
        if (socketToRemove) {
            socketToRemove.leave(token.roomIdPrev);
        }
    })

    function getRandomArbitrary(min, max) {
        return Math.floor(Math.random() * min) + max;
    }


    setInterval(function () {
        socket.emit('randomNumber', { temperature: getRandomArbitrary(10, 25), inDoor: getRandomArbitrary(25, 35), outDoor: getRandomArbitrary(25, 35) })

    }, 2000);

   

    socket.on("disconnect", () => {
        console.log(`User disconnect: ${socket.id}`)
    });

    // socket.on("getOneUser", async (data) => {
    //     userController.getUser(data, io);
    // })
    // User
    socket.on('getAllUser', async (data) => {
        userController.getlistUser(data, io);
    });
    socket.on('getUserLogin', async (uid) => {
        userController.getUserLogin(uid, io, socket);
    });
    socket.on('getUser', async (uid) => {
        userController.getUser(uid, io, socket);
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

    socket.on('addHoomToUser', async (data) => {
        userController.addHoomToUser(data, io);
    })
    socket.on('listUserToRoomId', async (data) => {
        userController.listUserToRoomId(data, io);
    })
    socket.on('deleteUserToRoomId', async (data) => {
        userController.deleteUserToRoomId(data, io)
    })

    //Room
    socket.on('getRoomLists', async (homeId) => {
        roomController.getListRoom(homeId, io, socket);
    });//nguyen

    socket.on('getRoomList', async (dataRoom) => {
        roomController.getList(dataRoom, io, socket);
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

    socket.on('createDeviceQrCode', async deviceData => {
        deviceController.createDeviceQrCode(deviceData, io)
    })

    socket.on('createDevice', async (deviceData) => {
        deviceController.createDevice(deviceData, io, socket);
    });
    // nguyen
    socket.on('getDevices', async (data) => {
        deviceController.getLists(data, io, socket);
    });
    // nguyen
    socket.on('getDevicesToHome', async (data) => {
        deviceController.getListforHome(data, io, socket);
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
    socket.on('getHomeUser', async (data) => {
       homeController.getListshome(data, io, socket);
    });// nguyen
    socket.on('createHome', async (homeData) => {
        homeController.createHome(homeData, io, socket);
    });
    socket.on("getitemhome", async (data) => {
        homeController.getList(data, io, socket)
    })
    socket.on('dropDownRoom', (dataRoom) => {
        homeController.getDropDownRoom(dataRoom, io)
    })

});

server.listen(port, () => {
    console.log(`Server is running on port http://localhost:${port}`);
});