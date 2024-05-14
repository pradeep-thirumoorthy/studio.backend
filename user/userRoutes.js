const express = require('express');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const authuser = require('./auth.js');

const { User } = require('../schema.js');
const productRoutes = require('./Products.js');
const galleryRoutes = require('./Gallery.js');

const router = express.Router();
router.use(bodyParser.json());

router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ username, password });
    if (!user) {
      return res.json({ success: false, message: 'User not found' });
    }
    const secretKey = 'your_secret_key';
    const token = jwt.sign({ username: user.username }, secretKey, { expiresIn: '1h' });
    res.cookie('token', token, { httpOnly: true, maxAge: 3600000}); // Expires in 1 hour

    return res.status(200).json({ success: true, message: 'Login successful', token });
  } catch (err) {
    console.error('MongoDB query error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});


router.use('/Product', productRoutes);
router.use('/Gallery', galleryRoutes);


router.put('/logout', (req, res) => {
  res.clearCookie("token");
  console.log("Token Cleared");
  return res.status(200).json({ success: true, message: 'Logout successful' });
});



router.get('/check-username', async (req, res) => {
  const { username } = req.query;
  try {
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.json({ available: false });
    }
    return res.json({ available: true });
  } catch (error) {
    console.error('Error checking username availability:', error);
    return res.status(500).json({ error: 'Server error' });
  }
});


router.get('/checkToken', async (req, res) => {
  try{
    const cookieHeader = req.headers.cookie;
    const {username} = await authuser(cookieHeader);
    res.sendStatus(200);
  }
  catch(err){
    res.sendStatus(401);
  }
});




router.get('/profile', async (req, res) => {
  try {
    const cookieHeader = req.headers.cookie;
    const {username} = await authuser(cookieHeader);
    const user = await User.findOne({ username }, { _id: 0 });


    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    return res.status(200).json({ success: true, user });
  } catch (err) {
    console.error('Error retrieving user profile:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});





router.post('/signup', async (req, res) => {
  const { username } = req.body;
  try {
    // Check if the username is already taken
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Username is already taken' });
    }

    const newUser = new User(req.body);

    await newUser.save();

    return res.status(201).json({ success: true, message: 'User signed up successfully' });
  } catch (error) {
    console.error('Error signing up user:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});
module.exports = router;