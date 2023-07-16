const Home = require('../model/home.model');
const User = require('../model/user.model');
const Room = require('../model/room.model');
const Device = require('../model/device.model');


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

const homeController = {
    getListshome: async (data, io, socket) => {
        const { _id, homeId } = data;
        try {
            const homes = await Home.find({ _id: homeId });
            io.to(_id).emit("listHomeUser", homes)
        } catch (error) {
            console.log(error);
        }
    },// nguyen
    getList: async (homeId, io, socket) => {
        try {
            const homes = await Home.findById(homeId).populate('roomId');
            io.to(socket.id).emit("listRoom", homes.roomId)
        } catch (error) {
            console.log(error);
        }
    },
    getList1: async (data, io, socket) => {
        //console.log(data);
        const {homeId,_id}= data;
        try {
            const homes = await Home.findById(homeId).populate('roomId');
            io.to(_id).emit("listRoom1", homes.roomId)
        } catch (error) {
            console.log(error);
        }
    },
    createHome: async (dataHome, io) => {
        try {
            const { uid } = dataHome;
            const home = new Home({ nameHome: makeId(5), uid });
            await home.save();

            const user = await User.findOne({ uid: uid });
            user.homeId.push(home._id);
            await user.save();
            await homeController.getDropDownHome(dataHome, io)
            await homeController.myHomeList(dataHome, io)

        } catch (error) {
            console.log(error);
            return null;
        }
    },

    myHomeList: async (data, io) => {
        try {
            const { uid } = data;
            const home = await Home.find({ uid: uid }).populate('roomId');
            io.emit(`myHomeList${uid}`, home);
        } catch (error) {
            console.log(error);
            return null;
        }
    },
    deleteHome: async (data, io) => {
        try {

            const { uid, id } = data;

            // Lấy danh sách các roomId của các phòng thuộc nhà cần xóa
            const home = await Home.findById(id).populate('roomId');
            const roomIds = home.roomId.map(room => room._id);

            // Lấy danh sách user có trường homeId[] chứa nhà bị xóa
            const users = await User.find({ homeId: id, uid: { $ne: uid } });

            // Xóa tất cả các phòng (rooms) thuộc danh sách roomIds
            await Room.deleteMany({ _id: { $in: roomIds } });

            // Xóa tất cả các thiết bị (devices) thuộc danh sách roomIds
            await Device.deleteMany({ roomId: { $in: roomIds } });

            // Xóa nhà (home)
            await Home.findByIdAndDelete(id);

            // Xóa homeId của tất cả các user chứa homeId bị xóa
            await User.updateMany({ homeId: id }, { $pull: { homeId: id } });

            // Gửi thông báo đến các user được tìm thấy
            users.forEach(async user => {
                let dropDownPromises = user.homeId.map(async id => {
                    const home = await Home.findById(id);
                    if (!home) return; // If home is null or undefined, return undefined
                    return { label: home.nameHome, value: home._id };
                });

                let dropDown = await Promise.all(dropDownPromises);

                // Filter out any undefined values from the dropDown array
                dropDown = await dropDown.filter(item => item !== undefined);

                io.emit(`deleteHome${user.uid}`, { home, dropDown });
            });

            await homeController.getDropDownHome(data, io)


        } catch (err) {
            console.log(err)
        }
    },

    getDropDownHome: async (dataHome, io) => {
        try {
            const { uid, homeId } = dataHome;

            const user = await User.findOne({ uid: uid }).populate({
                path: 'homeId',
                model: 'Home',
                select: ['nameHome', '_id'],
            });
            if (!user || !user.homeId) {
                return;
            }

            const homes = user.homeId.map((home) => ({
                label: home.nameHome,
                value: home._id,
            }));
            io.emit(`dropDownRoom${uid}`, homes);
        } catch (error) {
            console.error(error);
        }
    },
    updateHomeName: async (data, io) => {
        const { nameHome, homeId } = data
        try {
            await Home.findByIdAndUpdate(
                homeId,
                { nameHome },
                { new: true }
            );

            const users = await User.find({ homeId }).select('uid');
            users.forEach(async (user) => {
                await homeController.getDropDownHome(user, io);
            });

            await homeController.myHomeList(data, io)
        } catch (error) {
            console.error('Error updating home name:', error);
        }
    }
};

module.exports = homeController;