import mongoose from "mongoose";


const userSchema = new mongoose.Schema({
  phoneNo: String,
  firstName: String,
  lastName: String,
  username: String,
  password: String,
  email: String
});

const User = mongoose.model('User', userSchema, 'userLogins');

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
  userInfo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  amount: Number,
  status: String,
  razorpay_payment_id:String,
  razorpay_order_id:String,
  razorpay_signature:String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});
const Order = mongoose.model('Order', orderSchema, 'order');

const cartItemSchema = new mongoose.Schema({
  align: String,
  dimension: String,
  frameColor: String,
  image: String,
  username: String,
  amount: Number,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const CartItem = mongoose.model('CartItem', cartItemSchema, 'cart');

const gallerySchema = new mongoose.Schema({
    image: String,
    userId: String,
  });
  
  
const Gallery = mongoose.model('Gallery', gallerySchema, 'gallery');

const serviceSchema = new mongoose.Schema({
    title: String,
    description: String,
    contactNumber: String,
    imageUrl: String
  });

  const Service = mongoose.model('Service', serviceSchema);

const AdminSchema = new mongoose.Schema({
  username: String,
  password: String,
});


const eventSchema = new mongoose.Schema({
  date: {
    type: String,
    required: true
  },
  events: [
    {
      status: {
        type: String,
        enum: ['pending', 'in-process', 'completed'],
        required: true
      },
      task: {
        type: String,
        required: true
      },type: {
        type: String,
        required: true
      }
    }
  ]
});

const EventModel = mongoose.model('Event', eventSchema);

const Admin = mongoose.model('Admin', AdminSchema, 'adminLogins');
export default { User, Order, CartItem, Gallery ,Service,Admin,EventModel};
