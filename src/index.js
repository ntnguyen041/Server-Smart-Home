const express = require("express");
const mongoose = require('mongoose');
const http = require("http");
const cors = require("cors");
require('dotenv').config();
const { Server } = require("socket.io");
const userController = require('./controller/user.controller')
const roomController = require('./controller/room.controller')
const deviceController = require('./controller/device.controller')
const homeController = require('./controller/home.controller')
const app = express();
var port =process.env.PORT||3001;

//mongodb+srv://jiduy02:<password>@vn.ldsecnv.mongodb.net/?retryWrites=true&w=majority
//mongodb+srv://admin:<password>@smarthome.dahnw7r.mongodb.net/?retryWrites=true&w=majority
//const URL_MONGO = "mongodb+srv://admin:admin123@smarthome.dahnw7r.mongodb.net/?retryWrites=true&w=majority";

app.use(cors());
app.use(express.json());

const server = http.createServer(app);

mongoose.connect(process.env.URL_MONGO, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

const io = new Server(server, {
    cors: {
        origin: `http://localhost:3000`,
        methods: ["GET", "POST"],
    },
});

io.on("connection", (socket) => {

    console.log(`User connect: ${socket.id}`);
    // Tải danh sách user từ MongoDB và gửi về client
    // userController.getUsers(socket);
    // roomController.getRooms(socket);

    socket.on("disconnect", () => {
        console.log(`User disconnect: ${socket.id}`)
    });

    // User
    socket.on('getUser', async (uid) => {
        userController.getUsers(uid, io);
    });
    socket.on('createUser', async (userData) => {
        userController.createUser(userData, io);
    });

    socket.on('updateUser', async (userData) => {
        userController.updateUser(userData, io);
    });

    socket.on('deleteUser', async (userId) => {
        userController.deleteUser(userId, io);
    });

    //Room
    socket.on('createRoom', async (roomData) => {
        roomController.createRoom(roomData, io);
    });

    socket.on('updateRoom', async (roomData) => {
        roomController.updateRoom(roomData, io);
    });

    socket.on('deleteRoom', async (roomId) => {
        roomController.deleteRoom(roomId, io);
    });
    // Device
    socket.on('createDevice', async (deviceData) => {
        deviceController.createDevice(deviceData, io);
    });
    socket.on('getDevice', async (deviceData) => {
        deviceController.getList(deviceData, io);
    });

    // Home
    socket.on('createHome', async (homeData) => {
        homeController.createHome(homeData, io);
    });
    socket.on('getRoomList', async () => {
        homeController.getList(io);
    });

});

server.listen(port, () => {
    console.log(`Server is running on port http://localhost:${port}`);
});