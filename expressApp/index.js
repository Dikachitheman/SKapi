const express = require('express')
const app = express()
const mongoose = require('mongoose')
const User = require('./models/user')
const bcrypt = require('bcrypt')

const bodyParser = require('body-parser')

require('dotenv').config

const _ = require('lodash');
const path = require('path');
const {Donor} = require('./models/donor')
const {initializePayment, verifyPayment} = require('./controllers/utils');

const port = process.env.PORT || 4000;

app.use(express.static(path.join(__dirname, 'public/')));
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))

app.get('/verifyPayment/:reference', async(req, res) => {
  
  const reference = req.params.reference
  
  }
)

app.post('/initializePayment', async(req, res) => {

  try {
    initializePayment(req, res);
  } catch (err) {
    console.error('Error initialializing payment: ', err)
    res.status(500).json({message: 'Error making payment'})
  }

})

app.get('/', function(req, res) {
  res.send('hello')
})

app.post("/register-user", async (req, res ) => {
    try {
        const { username, email, password } = req.body;
        // console.log(req.body)

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({ username, email, password: hashedPassword })

        await newUser.save()

        res.json({newUser})
    } catch (err) {
        console.error('Error creating user: ', err);
        res.status(500).json({  message: 'Error creating user'})
    }
})

app.get("/get-users", async (req, res) => {
    try {
        const users  = await User.find();
        res.json(users);
    } catch (err) {
        console.error('Error fetching users: ', err);
        res.status(500).send('Error retrieving users')
    }
})

mongoose.connect('mongodb+srv://dikachianosike:dikachi@skbackend.uqcdxzl.mongodb.net/?retryWrites=true&w=majority&appname=SKbackend').then(() => {
    console.log("connected to databse")

    app.listen(port, function() {
        console.log('Server listening on port 4000');
      });
})
