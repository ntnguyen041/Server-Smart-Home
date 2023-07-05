const Home = require('../model/home.model');
const User = require('../model/user.model');

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
    getDropDownRoom: async (dataRoom, io) => {
        try {
            const { uid, homeId } = dataRoom;

            const user = await User.findOne({ uid: uid });
            if (!user || !user.homeId) {

                return;
            }

            const roomIds = user.homeId;
            const promises = roomIds.map(async (id) => {
                try {
                    const room = await Home.findById(id);
                    return { label: room.nameHome, value: room._id };
                } catch (error) {
                    console.error(error);
                    return null;
                }
            });
            const rooms = await Promise.all(promises);
            const arrDropDown = rooms.filter((room) => room !== null);

            io.emit(`dropDownRoom${uid}`, arrDropDown);
        } catch (error) {
            console.error(error);
        }
    }
};

module.exports = homeController;