const mongoose = require('mongoose')

const contestSchema = new mongoose.Schema({
    host: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    opponent: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    game: {
        type: String,
        required: true
    },
    wagerAmount: {
        type: Number,
        required: true
    },
    imageUrl: {
        type: String,
        required: false
    },
    winner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false
    },
    settled: {
        type: Boolean,
        default: false,
        required: false
    },
    isPrivate: {
        type: Boolean,
        default: false,
        required: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});


const Contest = mongoose.model('Contest', contestSchema)

module.exports = Contest