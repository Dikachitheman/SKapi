const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('./models/userSession'); // Import user model

const app = express();
const port = process.env.PORT || 5000;

// Connect to MongoDB database (replace with your connection string)
mongoose.connect('mongodb+srv://dikachianosike:dikachi@skbackend.uqcdxzl.mongodb.net/?retryWrites=true&w=majority&appname=SKbackend', {})
.then(() => console.log('MongoDB connected successfully'))
.catch(err => console.error('MongoDB connection error:', err));

// Session configuration
app.use(session({
  secret: 'your_very_secret_session_key', // Replace with a strong, unique secret
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }, // Set to true for HTTPS
}));

app.use(bodyParser.json());

// Register a new user
app.post('/register', async (req, res) => {
  const { username, email, password } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) return res.status(400).send('Email already exists');

  try {
    const newUser = new User({ username, email, password });
    const savedUser = await newUser.save();
    req.session.userId = savedUser._id; // Store user ID in session
    res.status(201).send({ message: 'User created successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error creating user');
  }
});

// Login and handle session
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(401).send('Invalid email or password');

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(401).send('Invalid email or password');

    req.session.userId = user._id; // Store user ID in session
    res.send({ message: 'Login successful' });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error during login');
  }
});

// Middleware to check if user is logged in
const isLoggedIn = (req, res, next) => {
  if (!req.session.userId) {
    return res.status(401).send('Unauthorized');
  }
  next();
};

// Protected route example (replace with actual protected routes)
app.get('/protected', isLoggedIn, async (req, res) => {
  // Access user data from session
  const userId = req.session.userId;
  console.log(userId)
  const user = await User.findById(userId);
  console.log('Session cookie:', req.headers.cookie)

  if (!user) {
    return res.status(401).send('Unauthorized');
  }

  res.send({ message: 'This is a protected route!', user });
})

app.listen(port, () => console.log(`Server listening on port ${port}`));