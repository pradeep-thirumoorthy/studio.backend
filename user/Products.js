import express from 'express';
import { Order, CartItem, User, Gallery } from '../schema.js';
import multer from 'multer';
import crypto from 'crypto';
import authuser from './auth.js';
import Razorpay from 'razorpay';

const router = express.Router();
const upload = multer();


router.post('/cart/pay',async (req,res)=>{
  try {
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_ID,
      key_secret: process.env.RAZORPAY_SECRET,
    });
    const cookieHeader = req.headers.cookie;
    const { username } = await authuser(cookieHeader);
    const cartItems = await CartItem.find({ username });
    if (cartItems.length === 0) {
      return res.status(400).json({ success: false, message: 'Cart is empty. Cannot convert to order.' });
    }
    const totalAmount = cartItems.reduce((acc, cartItem) => acc + cartItem.amount, 0);
    const order = await razorpay.orders.create({amount:totalAmount,currency:'INR',receipt:'receiptId'});
    if (!order) {
      return res.status(500).send("error");
    }
    res.json(order);
  } catch (err) {
    console.log(err);
  }
})
router.post('/cart/paynow',async (req,res)=>{
  try {
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_ID,
      key_secret: process.env.RAZORPAY_SECRET,
    });
    const cookieHeader = req.headers.cookie;
    const { username } = await authuser(cookieHeader);
    
    const {dimension,frameColor} =req.body;
    
    const order = await razorpay.orders.create({amount:amountCalculator(dimension, frameColor)*100,currency:'INR',receipt:'receiptId'});
    if (!order) {
      return res.status(500).send("error");
    }
    res.json(order);
  } catch (err) {
    console.log(err);
  }
})

router.post('/BuyNow', upload.single('image'), async (req, res) => {
  try {
    
    const cookieHeader = req.headers.cookie;
    const { username } = await authuser(cookieHeader);

    // Get form data fields from req.body
    const { requestData,
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature,
      billAmount,
    } = req.body;
    console.log(requestData,razorpay_order_id,razorpay_signature,billAmount);
    const {align, dimension, frameColor, image }=requestData;
    // Create a new order object
    const newOrder = new Order({
      items: [{
        align,
        dimension:`${dimension.x * 10} X ${dimension.y * 10}`,
        frameColor,
        image,
      }],
      username,
      status:'In Queue',
      amount:billAmount/100,
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature
    });
    
    await newOrder.save();

    
    const user = await User.findOne({ username });
    if (!user) {
      throw new Error('User not found');
    }

    const newGalleryItem = new Gallery({
      image,
      userId: user._id,
    });
    await newGalleryItem.save();

    return res.status(201).json({ success: true, message: 'Order saved successfully' });
  } catch (error) {
    console.error('Error saving order:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});
const basePrice = 10; // Base price for the frame
const pricePerSquareUnit = 5; // Price per square unit for dimension

const frameColors = [
  {
    color: "#683434",
    name: "brown",
  },
  {
    color: "#1a5e1a",
    name: "green",
  },
  {
    color: "#659994",
    name: "blue",
  },
  {
    color: "#896599",
    name: "mauve",
  },
  {
    color: "#ffa500",
    name: "orange",
  },
  {
    color: "#59555b",
    name: "grey",
  },
  {
    color: "#222222",
    name: "black",
  },
  {
    color: "#ececec",
    name: "white",
  },
];
const dimensionsLength = [
  {
    x: 0.6,
    y: 0.4,
  },
  {
    x: 0.8,
    y: 0.6,
  },
  {
    x: 1.0,
    y: 0.4,
  },
  {
    x:1.0,
    y:1.4
  },
];
const amountCalculator = (dimension, frameColor) => {
  const selectedDimension = dimensionsLength.find(dim => dim.x === dimension.x && dim.y === dimension.y);
  console.log(dimension);
  if (!selectedDimension) {
    throw new Error('Invalid dimension');
  }
  const selectedFrameColor = frameColors.find(color => color.name === frameColor);
  if (!selectedFrameColor) {
    throw new Error('Invalid frame color');
  }
  const area = selectedDimension.x * selectedDimension.y;
  const amount = basePrice + (area * pricePerSquareUnit);
  return amount*20;
};


router.post('/AddCart', async (req, res) => {
  try {
    const cookieHeader = req.headers.cookie;
    const { username } = await authuser(cookieHeader);

    const { align, dimension, frameColor, image } = req.body;
    const amount = amountCalculator(dimension, frameColor);
    const newCartItem = new CartItem({
      align,
      dimension: `${dimension.x * 10} X ${dimension.y * 10}`,
      frameColor,
      image,
      username,
      amount,
    });

    await newCartItem.save();
    const user = await User.findOne({ username });
    if (!user) {
      throw new Error('User not found');
    }

    const newGalleryItem = new Gallery({
      image,
      userId: user._id,
    });
    await newGalleryItem.save();
    return res.status(201).json({ success: true, message: 'Item added to cart successfully' });
  } catch (error) {
    console.error('Error adding item to cart:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});


router.post('/qrcode/:encryptedData/:encodedKey/:encodedIV', async (req, res) => {
  try {
    const { encryptedData, encodedKey, encodedIV } = req.params;
    const {orderId}=req.body;
    
    const key = Buffer.from(encodedKey, 'base64');
    const iv = Buffer.from(encodedIV, 'base64');

    // Decrypt the data using AES-256-CBC
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    let decryptedData = decipher.update(encryptedData, 'hex', 'utf-8');
    decryptedData += decipher.final('utf-8');

    const parsedData = JSON.parse(decryptedData);

    // Obtain username from authentication
    const cookieHeader = req.headers.cookie;
    const { username } = await authuser(cookieHeader);
    console.log(username,parsedData.username);
    console.log(parsedData._id,orderId);
    if (parsedData._id !== orderId || username !== parsedData.username) {
      return res.status(400).json({ success: false, message: 'Invalid order or UnAuthorized' });
    }

    const { _id } = parsedData;
    const order = await Order.findById(_id);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Update the order status to "Delivered"
    order.status = 'Delivered';
    await order.save();

    return res.status(200).json({ success: true, message:"Order Deliver Confirmed" });
  } catch (error) {
    console.error('Error processing encrypted data:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});


router.get('/Cart', async (req, res) => {
  try {
    const cookieHeader = req.headers.cookie;
    const { username } = await authuser(cookieHeader);

    const cartItems = await CartItem.find({ username });

    return res.status(200).json(cartItems);
  } catch (error) {
    console.error('Error fetching cart items:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.get('/Orders', async (req, res) => {
  try {
    
    const cookieHeader = req.headers.cookie;
    const { username } = await authuser(cookieHeader);

    const cartItems = await Order.find({ username });

    return res.status(200).json(cartItems);
  } catch (error) {
    console.error('Error fetching cart items:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});


router.get('/Orders/:status', async (req, res) => {
  try {
    const status = req.params.status;
    const cookieHeader = req.headers.cookie;
    const { username } = await authuser(cookieHeader);

    const orders = await Order.find({ status }, { items: 0 },{username}).populate('userInfo');
    return res.status(200).json(orders);
  } catch (error) {
    console.error('Error fetching cart items:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.delete('/removeCart/:itemId', async (req, res) => {
  try {
    const itemId = req.params.itemId;

    const deletedItem = await CartItem.findByIdAndDelete(itemId);

    if (!deletedItem) {
      return res.status(404).json({ success: false, message: 'Item not found in cart' });
    }

    return res.status(200).json({ success: true, message: 'Item removed from cart successfully' });
  } catch (error) {
    console.error('Error removing item from cart:', error);
    return res.status(500).json({ success: false, message: 'Failed to remove item from cart' });
  }
});

router.post('/CartToOrders', async (req, res) => {
  try {
    const cookieHeader = req.headers.cookie;
    const { username } = await authuser(cookieHeader);

    const cartItems = await CartItem.find({ username });

    const data = req.body;
    console.log(data);
    const {
      billAmount,
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature,
    } = data;
    if (cartItems.length === 0) {
      return res.status(400).json({ success: false, message: 'Cart is empty. Cannot convert to order.' });
    }
    console.log(data);
    const orderItems = cartItems.map(cartItem => ({
      align: cartItem.align,
      dimension: cartItem.dimension,
      frameColor: cartItem.frameColor,
      image: cartItem.image
    }));

    const newOrder = new Order({
      items: orderItems,
      username,
      status:'In Queue',
      amount: billAmount,
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature,
      createdAt: new Date(),
    });

    await newOrder.save();

    await CartItem.deleteMany({ username });

    return res.status(201).json({ success: true, message: 'Cart items converted to order successfully' });
  } catch (error) {
    console.error('Error converting cart items to order:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

export default router
