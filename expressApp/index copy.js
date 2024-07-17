const express = require('express')
const app = express()
const mongoose = require('mongoose')
const User = require('./models/user')
const bcrypt = require('bcrypt')

const bodyParser = require('body-parser')

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

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


  // Example Express route (replace with error handling and middleware):
app.post('/transactions', async (req, res) => {
  async function transferFunds(senderId, receiverId, amount) {
    try {
      // 1. Find sender and receiver users (ensure existence):
      const sender = await User.findById(senderId);
      const receiver = await User.findById(receiverId);
      if (!sender || !receiver) {
        throw new Error('Invalid sender or receiver');
      }
  
      // 2. Perform validation (ensure sufficient funds):
      if (sender.balance < amount) {
        throw new Error('Insufficient funds');
      }
  
      // 3. Start a Mongoose session (optional for better data consistency):
      const session = await mongoose.startSession();
      session.startTransaction();
  
      try {
        // 4. Update sender balance (decrement):
        sender.balance -= amount;
        await sender.save({ session }); // Save within session
  
        // 5. Update receiver balance (increment):
        receiver.balance += amount;
        await receiver.save({ session }); // Save within session
  
        // 6. Create transaction document:
        const newTransaction = new Transaction({ sender, receiver, amount });
        await newTransaction.save({ session }); // Save within session
  
        // 7. Commit the transaction (all operations succeed or fail together):
        await session.commitTransaction();
        console.log('Transaction successful');
  
      } catch (err) {
        // 8. Rollback the transaction on errors:
        await session.abortTransaction();
        console.error('Error during transfer:', err);
        throw err; // Re-throw error for handling in the calling code
      } finally {
        // 9. End the session:
        await session.endSession();
      }
    } catch (err) {
      console.error('Error transferring funds:', err);
      throw err; // Re-throw for handling at the calling point
    }
  }
  try {
    const { sender, receiver, amount } = req.body;

    // const senderDB = await User.find({ username: { $regex: new RegExp(sender, 'i') } }, { _id: 1, username: 1})
    // const receiverDB = await User.find({ username: { $regex: new RegExp(receiver, 'i') } }, { _id: 1, username: 1})

    const senderDB = await User.findOne({ username: sender })
    const receiverDB = await User.findOne({ username: receiver })

    if (senderDB && receiverDB) {
      const senderId = senderDB._id
      const receiverId = receiverDB._id

      await transferFunds(senderId, receiverId, amount);
      
    } else {
      console.log('Sender or receiver not found');
    }
    
    res.json({ message: 'Transaction successful' });
  } catch (err) {
      console.error('Transfer failed: ', err);
      res.status(500).send('Transaction failed')
  }
})
  
app.post('/paystack/pay', (req, res) => {
  const form = _.pick(req.body,['amount','email','full_name']);
  form.metadata = {
      full_name : form.full_name
  }
  form.amount *= 100;
  initializePayment(form, (error, body)=>{
      if(error){
          //handle errors
          console.log(error);
          return;
      }
      response = JSON.parse(body);
      res.redirect(response.data.authorization_url)
  });
});
app.get('/paystack/callback', (req,res) => {
  const ref = req.query.reference;
  verifyPayment(ref, (error,body)=>{
      if(error){
          //handle errors appropriately
          console.log(error)
          return res.redirect('/error');
      }
      response = JSON.parse(body);
      const data = _.at(response.data, ['reference', 'amount','customer.email', 'metadata.full_name']);
      [reference, amount, email, full_name] =  data;
      newDonor = {reference, amount, email, full_name}
      const donor = new Donor(newDonor)
      donor.save().then((donor)=>{
          if(!donor){
              res.redirect('/error');
          }
          res.redirect('/receipt/'+donor._id);
      }).catch((e)=>{
          res.redirect('/error');
     });
  });
});
app.get('/receipt/:id', (req, res)=>{
  const id = req.params.id;
  Donor.findById(id).then((donor)=>{
      if(!donor){
          //handle error when the donor is not found
          res.redirect('/error')
      }
      res.render('success.pug',{donor});
  }).catch((e)=>{
      res.redirect('/error')
  });
});
app.get('/error', (req, res)=>{
  res.render('error.pug');
}); 

// app.set('view engine', pug);
// app.get('/',(req, res) => {
//     res.render('index.pug');
// });

// Verify payment endpoint

mongoose.connect('mongodb+srv://dikachianosike:dikachi@skbackend.uqcdxzl.mongodb.net/?retryWrites=true&w=majority&appname=SKbackend').then(() => {
  console.log("connected to databse")

  app.listen(4000, function() {
    console.log('Server listening on port 4000');
  });
})
