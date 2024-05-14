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
const port = 3010;

// Middleware
app.use(cors({
  origin: '*',
  credentials: true
}));
app.use(bodyParser.json({ limit: '500mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '500mb' }));

app.get("/", (req, res) => res.send("Express on Vercel"));
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

module.exports=app;