const express = require('express');
const cors = require('cors'); // Enable CORS for front-end requests
const bodyParser = require('body-parser');
const mongoose = require('mongoose'); // Database connection
const jwt = require('jsonwebtoken'); // JSON Web Token library
const bcrypt = require('bcrypt'); // Password hashing

// Database models (replace with your schema)
const User = require('./models/user'); // Import user model
const Contest = require('./models/contests')
const Transaction = require('./models/transaction')

const app = express();
const port = process.env.PORT || 5000; // Use environment variable for port

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Connect to MongoDB database (replace with your connection string)
mongoose.connect('mongodb+srv://dikachianosike:dikachi@skbackend.uqcdxzl.mongodb.net/?retryWrites=true&w=majority&appname=SKbackend', {})
.then(() => console.log('MongoDB connected successfully'))
.catch(err => console.error('MongoDB connection error:', err));

// Secret key for JWT signing (replace with a strong, unique secret)
const secret = 'your_very_secret_key';

// Register a new user
app.post('/register', async (req, res) => {
  const { firstname, lastname, email, phonenumber, pin, password } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) return res.status(400).send('Email already exists');

  // Hash password before storing
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  const newUser = new User({
    firstname,
    lastname,
    email,
    phonenumber,
    pin,
    password: hashedPassword,
  });

  try {
    const savedUser = await newUser.save();
    res.status(201).send({ message: 'User created successfully' });
  } catch (err) {
    res.status(400).send('Error creating user');
  }
});

// Login and generate JWT
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  // Find user by email
  const user = await User.findOne({ email });
  if (!user) return res.status(401).send('Invalid email or password');

  // Check password match
  const validPassword = await bcrypt.compare(password, user.password);
  if (!validPassword) return res.status(401).send('Invalid email or password');

  // Generate JWT token
  const token = jwt.sign({ _id: user._id }, secret, { expiresIn: '30m' }); // Replace with appropriate expiration time

  res.send({
    token,
    user: {
      _id: user._id,
      username: user.username,
      email: user.email,
    },
  });
});

// Authorization middleware (replace with specific authorization logic based on JWT and user roles)
const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  console.log(authHeader)

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).send('Unauthorized');
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, secret);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).send('Invalid token');
  }
};

// Protected route example (replace with actual protected routes)
app.get('/protected', verifyToken, (req, res) => {
  res.send('This is a protected route!');
});


app.get('/users', async (req, res) => {
  try {
    const users = await User.find({}); // Find all users

    if (!users) {
      return res.status(404).json({ message: 'No users found' });
    }

    res.status(200).json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Inside your Express server file (e.g., server.js)

// Assuming you have already connected to MongoDB and defined the User schema

// Route to get a user by ID
app.get('/users/:id', async (req, res) => {
  const { id } = req.params; // Get user ID from request parameter

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'Invalid user ID' });
  }

  try {
    const user = await User.findById(id); // Find user by ID

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/initializecontest', async (req, res) => {
  const { hostid, opponentid, wagerAmount, game } = req.body;

  // Find user by email
  const hostdata = await User.findById( hostid );
  if (!hostdata) return res.status(401).send('Invalid email or password');

  // Find user by email
  const opponentdata = await User.findById( opponentid );
  if (!opponentdata) return res.status(401).send('Invalid email or password');

  host = hostdata._id
  opponent = opponentdata._id

  console.log(host)
  console.log(opponent)

  const newContest = new Contest({
    host,
    opponent,
    wagerAmount,
    game
  });

  try {
    const savedContest = await newContest.save();
    res.status(201).send({ message: 'Contest created successfully', status: true });
  } catch (err) {
    res.status(400).send('Error creating contest');
    console.log(err)
  }

})

app.get('/contests', async (req, res) => {
  try {
    const contests = await Contest.find({}); // Find all users

    if (!contests) {
      return res.status(404).json({ message: 'No contest found' });
    }

    res.status(200).json(contests);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/contests/:id', async (req, res) => {
  const { id } = req.params; // Get user ID from request parameter

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'Invalid contest ID' });
  }

  try {
    const contest = await Contest.findById(id); // Find user by ID

    if (!contest) {
      return res.status(404).json({ message: 'Contest not found' });
    }

    res.status(200).json(contest);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/initializetransaction', async (req, res) => {
  const { contestid, winnerid } = req.body

  const contestdata = await Contest.findById(contestid)
  if (!contestdata) return res.status(401).send('Invalid email or password');

  host = contestdata.host
  opponent = contestdata.opponent

  let winner = null
  let sender = null

  if ( winnerid == host ) {
    winner = host
    sender = opponent
  } else if ( winnerid == opponent ) {
    winner = opponent
    sender = host
  }

  const newTransaction = new Transaction({
    sender,
    receiver: winner,
    amount: contestdata.wagerAmount
  })

  try {
    const savedTransaction = await newTransaction.save();
    console.log({ message: 'Transaction created successfully', status: true });
  } catch (err) {
    res.status(400).send('Error creating transaction');
    console.log(err)
  }

  let session;

  try {
    // Start a session.
    session = await mongoose.startSession();
    session.startTransaction();

    // Debugging: Log session details
    console.log('Transaction started', session.transaction.number);

    // Perform the balance updates within the transaction.
    const [debitUser, creditUser] = await Promise.all([
      User.findByIdAndUpdate(sender, { $inc: { balance: -contestdata.wagerAmount } }, { session, new: true }),
      User.findByIdAndUpdate(winner, { $inc: { balance: contestdata.wagerAmount } }, { session, new: true }),
    ]);

    // Check if both users were found and updated.
    if (!debitUser || !creditUser) {
      await session.abortTransaction();
      console.log('Transaction aborted: User(s) not found');
      return res.status(404).json({ message: 'User(s) not found' });
    }

    // Commit the transaction.
    await session.commitTransaction();
    console.log('Transaction committed');
    res.status(200).json({ message: 'Balances updated successfully' });

  } catch (error) {
    console.error('Transaction error:', error);
    if (session) {
      await session.abortTransaction();
      console.log('Transaction aborted due to error');
    }
    res.status(500).json({ message: 'Error updating balances' });

  } finally {
    if (session) {
      await session.endSession();
      console.log('Session ended');
    }
  }

})

app.get("/transactions", async (req, res) => {

  try {
    const transactions = await Transaction.find({})

    if (!transactions) {
      return res.status(404).json({message: 'no transactions found'})
    }

    // console.log(transactions.schema)
    res.status(200).json(transactions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }

})

app.listen(port, () => console.log(`Server listening on port ${port}`));
