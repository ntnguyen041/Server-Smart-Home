const Home = require('../model/home.model');

const homeController = {
    getList: async (io) => {
        try {
            const homes = await Home.find().populate('roomId');
            io.emit("listRoom", homes[0].roomId)
        } catch (error) {
            console.log(error);
        }
    },
    createHome: async (req, res) => {
        const { nameHome } = req;
        console.log(nameHome);
        const newHome = new Home({ nameHome });
        try {
            const savedRoom = await newHome.save();

            // res.json(savedRoom);
        } catch (error) {
            console.log(error);
            // res.status(500).json({ message: 'Internal server error' });
        }
    },
};

module.exports = homeController;