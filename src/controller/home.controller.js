const Home = require('../model/home.model');

const homeController = {
    getList: async (homeId, io, socket) => {
        try {
            const homes = await Home.findById(homeId).populate('roomId');
            io.to(socket.id).emit("listRoom", homes.roomId) 
        } catch (error) {
            console.log(error);
        }
    },
    createHome: async (req, res) => {
        const { nameHome } = req;
        console.log(nameHome);
        const newHome = new Home({ nameHome });
        try {
            await newHome.save();
        } catch (error) {
            console.log(error);
        }
    },
};

module.exports = homeController;