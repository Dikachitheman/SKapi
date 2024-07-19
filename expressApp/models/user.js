const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
    firstname: {
        type: String,
        required: true
    },
    lastname: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    phonenumber: {
        type: Number,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true,
    },
    pin : {
        type: Number,
        required: false,
        unique: false
    },
    transactions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Transaction'}],
    balance: {
        type: Number,
        required: false,
        default: 100,
    },
})

const User = mongoose.model('User', userSchema)

module.exports = User