const Home = require('../model/home.model');

const homeController = {
    createHome: async (req, res) => {
        const { nameHome } = req;
        console.log( nameHome);
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