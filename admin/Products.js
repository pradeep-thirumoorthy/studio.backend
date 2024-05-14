const express = require('express');
const mongoose = require('mongoose');
const crypto = require('crypto');
const authadmin = require('./auth.js');

const userSchema = new mongoose.Schema({
  phoneNo: String,
  firstName: String,
  lastName: String,
  username: String,
  password: String,
  email: String
});

const User = mongoose.model('Users', userSchema, 'userLogins');

const orderItemSchema = new mongoose.Schema({
  align: String,
  dimension: String,
  frameColor: String,
  image: String,
  amount: Number,
});

const orderSchema = new mongoose.Schema({
  items: [orderItemSchema],
  username: String,
  userInfo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Reference to User model
  amount: Number,
  status: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});


const Order = mongoose.model('Orders', orderSchema, 'order');

const router = express.Router();

router.get('/Orders/:status', async (req, res) => {
  try {
    const status = req.params.status;
    const cookieHeader = req.headers.cookie;
    const {username} = await authadmin(cookieHeader);

    
    const orders = await Order.find({status},{items:0}).populate('userInfo');
    return res.status(200).json(orders);
  } catch (error) {
    console.error('Error fetching cart items:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});


router.get('/qrcode', async (req, res) => {
  try {
    const { orderId } = req.query;
    const order = await Order.findById(orderId).populate('userInfo');

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const { username, _id } = order;
    const dataToEncrypt = { username, _id };

    // Generate a random key and initialization vector (IV)
    const key = crypto.randomBytes(32); // 256 bits
    const iv = crypto.randomBytes(16); // 128 bits

    // Encrypt the data using AES-256-CBC
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    let encryptedData = cipher.update(JSON.stringify(dataToEncrypt), 'utf-8', 'hex');
    encryptedData += cipher.final('hex');

    // Encode key and IV as base64 for transmission
    const encodedKey = key.toString('base64');
    const encodedIV = iv.toString('base64');

    // Construct the QR code URL with the encrypted data, key, and IV
    const qrCodeUrl = `http://localhost:3010/user/Product/qrcode/${encodeURIComponent(encryptedData)}/${encodeURIComponent(encodedKey)}/${encodeURIComponent(encodedIV)}`;
    
    return res.status(200).json({ success: true, qrCodeUrl });
  } catch (error) {
    console.error('Error fetching product details:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});




router.get('/items', async (req, res) => {
  try {
    const { productId, username } = req.query;

    // Assuming userInfo is a separate collection referenced by the Order model
    const userInfo = await User.findOne({ username });
    // Find items related to the specified _id and populate userInfo
    const items = await Order.find({ _id: productId }).populate('userInfo');

    // Combine items and userInfo into a single object
    const responseData = {
      items: items[0].items,
      userInfo: userInfo
    };

    return res.status(200).json(responseData);
  } catch (error) {
    console.error('Error fetching cart items:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.post('/Updation', async (req, res) => {
  try {
    const { orderId} = req.body; // Extract orderId and status from req.body
    
    const cookieHeader = req.headers.cookie;
    const {username} = await authadmin(cookieHeader);
    // Find the order by orderId
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Check if the current status allows for updating
    if (order.status === 'In Queue') {
      order.status = 'Manufacturing';
    } else if (order.status === 'Manufacturing') {
      order.status = 'Processing';
    } else if (order.status === 'Processing') {
      order.status = 'Shipped';
    } else {
      // Return a message indicating no update was performed
      return res.status(400).json({ success: false, message: 'No update performed. Invalid status transition.' });
    }

    // Save the updated order
    await order.save();

    return res.status(200).json({ success: true, message: 'Order status updated successfully', updatedOrder: order });
  } catch (error) {
    console.error('Error updating order status:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});




module.exports = router;
