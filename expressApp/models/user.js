const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
    firstname: {
        type: String,
        required: true
    },
    username: {
        type: String,
        required: true,
        unique: true,
    },
    imageUrl: {
        type: String,
        required: false
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
    pin: {
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
    wins: {
        type: Number,
        required: false,
        unique: false,
        default: 0
    },
    losses: {
        type: Number,
        required: false,
        unique: false,
        default: 0
    },
})

const User = mongoose.model('User', userSchema)

module.exports = User