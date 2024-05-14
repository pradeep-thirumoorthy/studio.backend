require('dotenv').config();


const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const userRoutes = require('./user/userRoutes.js');
const adminRoutes = require('./admin/adminRoutes.js');
const mongoose = require('mongoose');
const { Service } = require('./schema.js');

const uri = process.env.MONGODB_URI;
mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
const db = mongoose.connection;

const clientOptions = { serverApi: { version: '1', strict: true, deprecationErrors: true } };
async function run() {
  try {
    await mongoose.connect(uri, clientOptions);
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    
  }
}
run().catch(console.dir);
const app = express();
const port = process.env.PORT;

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '500mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '500mb' }));

app.get("/", (req, res) => res.send("Express on Vercel"));
app.use('/user', userRoutes);
app.use('/admin', adminRoutes);


app.get('/services', async (req, res) => {
  try {
    const services = await Service.find();
    res.status(200).json(services);
  } catch (error) {
    console.error('Error fetching services:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});



app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

module.exports=app;