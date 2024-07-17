const mongoose = require('mongoose');

const getLeaderboard = async (req, res) => {
  try {
    const leaderboard = await User.aggregate([
      { $sort: { wins: -1 } }, // Sort users by wins in descending order
      { $limit: 10 }, // Limit the leaderboard to top 10 users (adjust as needed)
      {
        $project: {
          _id: 0, // Exclude _id from the output
          username: 1,
          wins: 1,
          // Add more fields to the projection if desired (e.g., total wagers)
        },
      },
    ]);

    res.json(leaderboard);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching leaderboard' });
  }
};


const mongoose = require('mongoose');

const contestSchema = new mongoose.Schema({
    initiator: {
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
    winner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    settled: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

contestSchema.pre('save', async function (next) {
    // Ensure initiator and opponent have sufficient wallet funds before creating contest
    const initiatorBalance = await User.findById(this.initiator).select('wallet');
    const opponentBalance = await User.findById(this.opponent).select('wallet');

    if (initiatorBalance.wallet < this.wagerAmount || opponentBalance.wallet < this.wagerAmount) {
        throw new Error('Insufficient wallet funds for both users');
    }

    next();
});

module.exports = mongoose.model('Contest', contestSchema);


const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    isAdmin: {
        type: Boolean,
        default: false
    },
    wins: {
        type: Number,
        default: 0
    },
    wallet: {
        type: Number,
        default: 0.0 // Consider storing wallet balance as a decimal for precision
    }
});

module.exports = mongoose.model('User', userSchema);


const createContest = async (req, res) => {
    try {
      const { initiator, opponent, game, wagerAmount } = req.body;
  
      // Check if initiator and opponent exist
      const initiatorExists = await User.findById(initiator);
      const opponentExists = await User.findById(opponent);
  
      if (!initiatorExists || !opponentExists) {
        return res.status(400).json({ message: 'Invalid user ID(s)' });
      }
  
      // Check if users have sufficient funds
      const initiatorBalance = await User.findById(initiator).select('wallet');
      const opponentBalance = await User.findById(opponent).select('wallet');
  
      if (initiatorBalance.wallet < wagerAmount || opponentBalance.wallet < wagerAmount) {
        return res.status(400).json({ message: 'Insufficient wallet funds' });
      }
  
      // Create a new Contest instance
      const newContest = new Contest({
        initiator,
        opponent,
        game,
        wagerAmount,
      });
  
      await newContest.save(); // Save the contest to the database
  
      res.status(201).json({ message: 'Contest created successfully', contest: newContest });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error creating contest' });
    }
  };

  
  const getUserContests = async (req, res) => {
    try {
      const userId = req.params.userId;
  
      const contests = await Contest.find({
        $or: [
          { initiator: userId },
          { opponent: userId },
        ],
      }).populate('initiator opponent'); // Populate user details
  
      res.json(contests);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error fetching contests' });
    }
  };

  
  const getContestById = async (req, res) => {
    try {
      const contestId = req.params.contestId;
  
      const contest = await Contest.findById(contestId).populate('initiator opponent');
  
      if (!contest) {
        return res.status(404).json({ message: 'Contest not found' });
      }
  
      res.json(contest);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error fetching contest' });
    }
  };

  
  const settleContest = async (req, res) => {
    try {
      const contestId = req.params.contestId;
      const winnerId = req.body.winnerId; // Winner ID from the request body (should be validated for security)
  
      const contest = await Contest.findById(contestId);
  
      if (!contest) {
        return res.status(404).json({ message: 'Contest not found' });
      }
  
      if (contest.settled) {
        return res.status(400).json({ message: 'Contest already settled' });
      }
  
      // Validate winner ID (ensure it's one of the participants)
      if (![contest.initiator, contest.opponent].includes(winnerId)) {
        return res.status(400).json({ message: 'Invalid winner ID' });
      }
  
      const loserId = contest.initiator === winnerId ? contest.opponent : contest.initiator;
  
      // Update winner and loser balances
      const winner = await User.findByIdAndUpdate(winnerId, { $inc: { wins: 1, wallet: contest.wagerAmount } });
      const loser = await User.findByIdAndUpdate(loserId, { $inc: { wallet: -contest.wagerAmount } });
  
      if (!winner || !loser) {
        return res.status(500).json({ message: 'Error updating user balances' });
      }
  
      contest.winner = winnerId;
      contest.settled = true;
      await contest.save();
  
      // Trigger notifications for both users about the outcome (implementation not shown here)
  
      res.json({ message: 'Contest settled successfully', contest });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error settling contest' });
    }
  };


const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email: { type: String, required: true },
  password: { type: String, required: true },
  // Other fields...
});

const Admin = mongoose.model('Admin', adminSchema);
module.exports = Admin;

const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, required: true }, // "deposit", "withdrawal", "bet", etc.
  amount: { type: Number, required: true },
  // Other fields...
});

const Transaction = mongoose.model('Transaction', transactionSchema);
module.exports = Transaction;

const mongoose = require('mongoose');

const leaderboardSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  wins: { type: Number, default: 0 },
  // Other fields...
});

const Leaderboard = mongoose.model('Leaderboard', leaderboardSchema);
module.exports = Leaderboard;


const mongoose = require('mongoose');

const contestSchemaII = new mongoose.Schema({
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  game: { type: String, required: true },
  betAmount: { type: Number, required: true },
  status: { type: String, enum: ['ongoing', 'settled'], default: 'ongoing' },
  // Other fields...
});

const Contest = mongoose.model('Contest', contestSchema);
module.exports = Contest;

const mongoose = require('mongoose');

const userSchemaII = new mongoose.Schema({
  username: { type: String, required: true },
  email: { type: String, required: true },
  password: { type: String, required: true },
  walletBalance: { type: Number, default: 0 },
  // Other fields...
});

const User = mongoose.model('User', userSchema);
module.exports = User;

// leaderboardController.js
const Leaderboard = require('../models/Leaderboard'); // Assuming you've defined the Leaderboard model

exports.getLeaderboard = async (req, res) => {
  // Aggregate wins and return the ranked list
};

// leaderboardRoutes.js
const express = require('express');
const router = express.Router();
const LeaderboardController = require('../controllers/leaderboardController');

// Get leaderboard
router.get('/', LeaderboardController.getLeaderboard);

module.exports = router;


// contestController.js
const Contest = require('../models/Contest'); // Assuming you've defined the Contest model

exports.createContest = async (req, res) => {
  // Add contest details to the database
};

exports.joinContest = async (req, res) => {
  // Update participants list
};

exports.settleContest = async (req, res) => {
  // Determine the winner and handle wallet transfers
};

// contestRoutes.js
const express = require('express');
const router = express.Router();
const ContestController = require('../controllers/contestController');

// Create contest
router.post('/create', ContestController.createContest);

// Join contest
router.post('/join/:contestId', ContestController.joinContest);

// Settle contest
router.post('/settle/:contestId', ContestController.settleContest);

module.exports = router;


// userController.js
const User = require('../models/User'); // Assuming you've defined the User model

exports.registerUser = async (req, res) => {
  // Implement user registration logic
};

exports.loginUser = async (req, res) => {
  // Implement user login logic
};

exports.getUserProfile = async (req, res) => {
  // Fetch user details from the database
};

exports.depositToWallet = async (req, res) => {
  // Handle wallet deposit
};

exports.withdrawFromWallet = async (req, res) => {
  // Handle wallet withdrawal
};


// userRoutes.js
const express = require('express');
const router = express.Router();
const UserController = require('../controllers/userController');

// Registration and login
router.post('/register', UserController.registerUser);
router.post('/login', UserController.loginUser);

// User profile
router.get('/profile', UserController.getUserProfile);

// Wallet transactions
router.post('/deposit', UserController.depositToWallet);
router.post('/withdraw', UserController.withdrawFromWallet);

module.exports = router;
