const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true,
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