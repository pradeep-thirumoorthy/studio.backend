require('dotenv').config();


const express = require('express');
// const bodyParser = require('body-parser');
// const cors = require('cors');
// const userRoutes = require('./user/userRoutes.js');
// const adminRoutes = require('./admin/adminRoutes.js');
// const { Service } = require('./schema.js');

const mongoose = require('mongoose');

const uri = process.env.MONGODB_URI;

async function connectToDatabase() {
  try {
    await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log("Connected to MongoDB successfully!");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
    process.exit(1); // Exit the process if unable to connect to MongoDB
  }
}

connectToDatabase();
const app = express();
const port = process.env.PORT;

// Middleware
// app.use(cors(
// //   {
// //   origin: '',
// //   credentials: true
// // }
// ));
// app.use(bodyParser.json({ limit: '500mb' }));
// app.use(bodyParser.urlencoded({ extended: true, limit: '500mb' }));

app.get("/", (req, res) => {
  res.send("Express on Vercel");
});
// app.use('/user', userRoutes);
// app.use('/admin', adminRoutes);

// app.use((err, req, res, next) => {
//   console.error(err.stack);
//   res.status(500).send('Internal Server Error');
// });

app.get('/services', async (req, res) => {
  try {
    //const services = await Service.find();
    res.status(200).json({"services":"qawsedrf"});
  } catch (error) {
    console.error('Error fetching services:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


// module.exports = db;

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

module.exports=app;