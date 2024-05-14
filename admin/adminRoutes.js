import express from 'express';
import bodyParser from 'body-parser';
import jwt from 'jsonwebtoken';
import authadmin from './auth.js';
import productRoutes from './Products.js';
import Services from './Services.js';
import { Admin, EventModel } from './../schema.js';



const router = express.Router();
router.use(bodyParser.json());




router.use('/services',Services);

router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await Admin.findOne({ username, password });
    if (!user) {
      return res.json({ success: false, message: 'Admin not found' });
    }
    const secretKey = 'your_secret_key';
    const token = jwt.sign({ username: user.username }, secretKey, { expiresIn: '1h' });
    res.cookie('admin-token', token, { httpOnly: true, maxAge: 3600000, sameSite: 'None'});
 // Expires in 1 hour

    return res.status(200).json({ success: true, message: 'Login successful', token });
  } catch (err) {
    console.error('MongoDB query error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});


router.put('/logout', (req, res) => {
  res.clearCookie("admin-token", { sameSite: "None" });
  console.log("Token Cleared");
  return res.status(200).json({ success: true, message: 'Logout successful' });
});

router.get('/calendar', async (req, res) => {
  try {
    const events = await EventModel.find();
    
    // Organize events by date
    const organizedEvents = {};
    events.forEach(event => {
      const { date, events: eventDetails } = event;
      organizedEvents[date] = eventDetails.map(({ status, task ,type,_id}) => ({type,status, content: task ,_id}));
    });
    
    res.status(200).json(organizedEvents);
  } catch (error) {
    console.error('Error fetching calendar events:', error);
    res.status(500).json({ error: 'Server error' });
  }
});


router.post('/calendar/add', async (req, res) => {
  try {
    const { date, status, task,type } = req.body;
    console.log(date,status,task,type);
    if (!status || !task || !type) {
      return res.status(400).json({ error: 'status and content are required' });
    }

    const existingEvent = await EventModel.findOne({ date });

    if (existingEvent) {
      existingEvent.events.push({ status, task ,type});
      await existingEvent.save();
      res.status(200).json({ message: 'Events updated successfully' });
    } else {
      const newEvent = new EventModel({
        date,
        events: [{ status, task ,type}]
      });
      await newEvent.save();
      res.status(201).json({ message: 'Events created successfully' });
    }
  } catch (error) {
    console.error('Error creating/updating events:', error);
    res.status(500).json({ error: 'Server error' });
  }
});





router.post('/calendar/update', async (req, res) => {
  const { id, date } = req.body;

  try {
    const event = await EventModel.findOne({ 'events._id': id, date });

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const eventIndex = event.events.findIndex(item => item._id.toString() === id);
    if (eventIndex === -1) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const currentStatus = event.events[eventIndex].status;
    let newStatus;

    // Update status based on current status
    switch (currentStatus) {
      case 'pending':
        newStatus = 'in-process';
        break;
      case 'in-process':
        newStatus = 'completed';
        break;
      default:
        newStatus = currentStatus; // Keep the current status if not 'pending' or 'in-process'
        break;
    }

    const updatedEvent = await EventModel.findOneAndUpdate(
      { 'events._id': id, date },
      { $set: { 'events.$.status': newStatus } },
      { new: true }
    );

    res.status(200).json({ message: 'Event updated successfully', event: updatedEvent });
  } catch (error) {
    console.error('Error updating event:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});




router.get('/checkToken', async (req, res) => {
  try {
    const cookieHeader = req.headers.cookie;
    const username = await authadmin(cookieHeader);
    res.sendStatus(200);
  } catch (err) {
    res.sendStatus(401);
  }
});


router.use('/Product', productRoutes);


router.get('/profile', async (req, res) => {
  try {
    const cookieHeader = req.headers.cookie;
    const usernamePromise = authadmin(cookieHeader);
    const {username} = await usernamePromise;
    const user = await Admin.findOne({ username }, { _id: 0 });

    if (!user) {
      return res.status(404).json({ success: false, message: 'Admin not found' });
    }

    return res.status(200).json({ success: true, user });
  } catch (err) {
    console.error('Error retrieving user profile:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});
export default router