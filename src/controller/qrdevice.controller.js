const { model } = require("mongoose")
const QR = require("../model/qrdevice.model")
const QRcontroller ={
    createPinEsp: async (data, io,socket) => {
        console.log(data);
        const newPin = new QR(data);
        try {
            await newPin.save();
        } catch (error) {
            console.log(error);
        }
    },
}
module.exports = QRcontroller;