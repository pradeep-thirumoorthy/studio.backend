import express from 'express';
import bodyParser from 'body-parser';
import jwt from 'jsonwebtoken';
import authuser from './auth.js';
import { User } from '../schema.js';
import productRoutes from './Products.js';
import galleryRoutes from './Gallery.js';

import nodemailer from 'nodemailer';

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
    res.cookie('token', token, { httpOnly: true, maxAge: 3600000, sameSite: 'None', secure: true }); // Expires in 1 hour

    return res.status(200).json({ success: true, message: 'Login successful', token });
  } catch (err) {
    console.error('MongoDB query error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});


router.use('/Product', productRoutes);
router.use('/Gallery', galleryRoutes);


router.put('/logout', (req, res) => {
  res.cookie('token', "-----" ,{ httpOnly: true, maxAge: 0, sameSite: 'None', secure: true });
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





// Generate a random 6-digit OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000);
}

// Create a Nodemailer transporter
const transporter = nodemailer.createTransport({
  service: 'Gmail', // Specify your email service provider, e.g., 'Gmail', 'Yahoo', etc.
  auth: {
    user: 'pradeept.21cse@kongu.edu', // Specify your email address
    pass: 'World@12345qwert' // Specify your email password or application-specific password
  }
});

// Route to generate and send OTP
router.get('/otp', async (req, res) => {
  try {
    // Generate a 6-digit OTP
    
    const { email } = req.query;
    const otp = generateOTP();
console.log(otp,email);
    // Send OTP to frontend

    // Send OTP via email
    const mailOptions = {
      from: 'pradeept.21cse@kongu.edu',
      to: email,
      subject: 'Your OTP',
      text: `Your OTP is: ${otp}`
    };

    
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('Error sending email:', error);
      } else {
        
        res.status(200).json({ success: true, otp: otp });
        console.log('Email sent:', info.response);
      }
    });
  } catch (error) {
    console.error('Error generating OTP:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});


router.post('/signup', async (req, res) => {
  const { username, email, phoneNo } = req.body;
  try {
    // Check if the username, email, or phone number is already taken
    const existingUser = await User.findOne({ $or: [{ username }, { email }, { phoneNo }] });
    if (existingUser) {
      const takenFields = [];
      if (existingUser.username === username) takenFields.push('username');
      if (existingUser.email === email) takenFields.push('email');
      if (existingUser.phoneNo === phoneNo) takenFields.push('phone number');
      return res.status(400).json({ success: false, message: `${takenFields.join(', ')} already taken` });
    }

    const newUser = new User(req.body);

    await newUser.save();

    return res.status(201).json({ success: true, message: 'User signed up successfully' });
  } catch (error) {
    console.error('Error signing up user:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});


export default router;
