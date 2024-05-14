const Razorpay = require("razorpay");
const crypto = require("crypto");
const Order = require("../models/OrderModel.js");
const AppError = require("../utils/appError.js");
const ShoppingCart = require("../models/CartModel.js");
const Product = require("../models/ProductModel.js");
const User = require("../models/UserModel.js");


export const tryOrder = async (req, res) => {
  try {
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_ID,
      key_secret: process.env.RAZORPAY_SECRET,
    });
    const options = req.body;
    const order = await razorpay.orders.create(options);
    if (!order) {
      return res.status(500).send("error");
    }
    res.json(order);
  } catch (err) {
    console.log(err);
  }
};

export const createOrder = async (req, res, next) => {
  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    products,
    user,
  } = req.body;

  const sha = crypto.createHmac("sha256", process.env.RAZORPAY_SECRET);
  //order_id + "|" + razorpay_payment_id
  sha.update(`${razorpay_order_id}|${razorpay_payment_id}`);
  const digest = sha.digest("hex");
  if (digest !== razorpay_signature) {
    return res.status(400).json({ msg: "Transaction is not legit!" });
  }
  console.log("order post called");
  try {
    const data = req.body;
    console.log(data);
    const {
      user:userId,
      products,
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature,
    } = data;
    const productItems = products.items.map((item) => ({
      product: item.itemId,
      quantity: item.quantity,
      price: item.price,
    }));
    console.log(productItems);
    const newOrder = new Order({
      user,
      products: productItems,
      billAmount: products.billAmount,
      totalQuantity: products.totalQuantity,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    });

    // Save the new order to the database
    await newOrder.save();

    const currUser = await User.findById(userId);
    if (!currUser) {
      return next(new AppError("User not found", 404));
    }

    // Push the new order to the user's orders array
    currUser.orders.push(newOrder._id);

    // Save the updated user document
    await currUser.save();

    
    await ShoppingCart.findOneAndDelete({user:user})

    for (const item of products.items) {
      const product = await Product.findById(item.itemId);
      if (product) {
        product.quantity -= item.quantity;
        await product.save();
      }
    }


  } catch (error) {
    console.error("Error saving order:", error);
    return next(new AppError("Error saving orders to db", 500));
  }
  res.json({
    status: "success",
    orderId: razorpay_order_id,
    paymentId: razorpay_payment_id,
    products,
    user,
  });
};

export const cancelOrder =async (req, res, next) => {
  const transactionId  = req.params.id

  try{
    const order = await Order.findOne({razorpay_payment_id:transactionId});
    if (!order) {
      return next(new AppError("Order not found", 404));
    }
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_ID,
      key_secret: process.env.RAZORPAY_SECRET,
    })
    try{
      const refundResponse = razorpay.payments.refund(transactionId,{
        amount: (order.billAmount * 100)/2, 
        speed:'normal',
      })
      for (const item of order.products) {
        const product = await Product.findById(item.product);
        if (product) {
          product.quantity += item.quantity; // Add back the cancelled quantity
          await product.save();
        }
      }
    }catch(error){
      return next(new AppError(`Refund failure. an error in gateway.${error}`, 400))
    }
    order.status = 'cancelled'
      await order.save();

    res.json({
      status:"success",
      message: "Order cancelled successfully",
    })
  }catch(err){
    return next(new AppError(`Something went wrong. cant cancel the order`,404))
  }
};

export const getOrders = async (req, res, next) => {
  try {
    const order = await Order.find({ user:  req.params.id });

    if (!order) {
      return next(new AppError("No orders found.", 404));
    }
    res.status(200).json({
      status: "successfully got the orders",
      order,
    });
  } catch (err) {
    console.log(err);
    return next(new AppError("Error getting the orders", 404));
  }
};

export const getAllOrders = async(req, res, next) => {
  try{
    let orders = await Order.find({})
    return res.status(200).json({
      status: "success",
      data: orders,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "Failed to fetch user",
    });
  }
};

export const updateOrder = async(req, res, next) => {
  try{
    const order = await Order.findByIdAndUpdate(req.params.id, req.body,{
      new:true,
      runValidators:true
    })
    if (!order) {
      return next(new AppError("No order found with that ID", 404));
    }

    res.status(200).json({
      status: "successfully updated the order details",
      data: {
        data: order,
      },
    });
  } catch (err) {
    console.log(err);
    return next(new AppError("Error editing the order", 404));
  }
};
