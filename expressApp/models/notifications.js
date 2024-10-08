const mongoose = require('mongoose')

const notificationSchema = new mongoose.Schema({
    userid: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    header: {
        type: String,
        required: true
    },
    info: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});


const Notification = mongoose.model('Notification', notificationSchema)

module.exports = Notification