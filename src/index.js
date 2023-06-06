const express = require("express");
const mongoose = require('mongoose');
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");
const userController = require('./controller/user.controller')
const app = express();
const port = 3000;

//mongodb+srv://jiduy02:<password>@vn.ldsecnv.mongodb.net/?retryWrites=true&w=majority

const URL_MONGO = "mongodb+srv://jiduy02:jiduy02@vn.ldsecnv.mongodb.net/?retryWrites=true&w=majority";

app.use(cors());
app.use(express.json());

const server = http.createServer(app);

mongoose.connect(URL_MONGO, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

const io = new Server(server, {
    cors: {
        origin: `http://localhost:${port}`,
        methods: ["GET", "POST"],
    },
});

io.on("connection", (socket) => {
    socket.on('sendData', (data) => {
        console.log(data);
        io.emit({ value: data.value });
    });

    // Tải danh sách user từ MongoDB và gửi về client
    userController.getUsers(socket);

    socket.on("disconnect", () => {
        console.log(`User disconnect: ${socket.id}`)
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
});

server.listen(port, () => {
    console.log(`Server is running on port http://localhost:${port}`);
});