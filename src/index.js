const express = require("express");
const mongoose = require('mongoose');
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");
const userController = require('./controller/user.controller')
const roomController = require('./controller/room.controller')
const deviceController = require('./controller/device.controller')
const homeController = require('./controller/home.controller')
const app = express();
var port = process.env.PORT || 3001;

//mongodb+srv://jiduy02:<password>@vn.ldsecnv.mongodb.net/?retryWrites=true&w=majority
//mongodb+srv://admin:<password>@smarthome.dahnw7r.mongodb.net/?retryWrites=true&w=majority
// const URL_MONGO = "mongodb+srv://admin:admin123@smarthome.dahnw7r.mongodb.net/?retryWrites=true&w=majority";

app.use(cors());
app.use(express.json());

const server = http.createServer(app);

mongoose.connect("mongodb+srv://admin:admin123@smarthome.dahnw7r.mongodb.net/?retryWrites=true&w=majority", {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
    .then(() => console.log('Connected to MongoDB'))
    .catch((err) => console.error('Could not connect to MongoDB', err));

const io = new Server(server, {
    cors: {
        origin: [`http://localhost:3000`, `https://smarthome-ckc.onrender.com`],
        methods: ["GET", "POST"],
    },
});

io.on("connection", (socket) => {
    console.log(`User connect: ${socket.id}`);
    socket.on('joinRoom', data => {
        socket.join(data);
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

    socket.on('listDeviceDropDown', () => {
        deviceController.getDropDownList(io, socket);
    })

    socket.on('updateDeviceOnOff', async (deivceData) => {
        deviceController.updateDeviceOnOff(deivceData, io, socket);
    })

    socket.on('getListDeviceTime', async () => {
        deviceController.getListDeviceTime(io, socket);
    })

    socket.on('updateScheduleOnOff', async (deviceData) => {
        deviceController.updateScheduleOnOff(deviceData, io, socket);
    })

    // Home
    socket.on('createHome', async (homeData) => {
        homeController.createHome(homeData, io, socket);
    });

});

server.listen(port, () => {
    console.log(`Server is running on port http://localhost:${port}`);
});