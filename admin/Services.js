const express = require('express');
const authadmin = require('./auth.js');
const {Service} = require('./../schema.js');

const router = express.Router();

router.post('/add', async (req, res) => {
    try {
    const cookieHeader = req.headers.cookie;
    const {username} = await authadmin(cookieHeader);
      const { title, description, contactNumber, imageUrl } = req.body;
  
      // Create a new service document
      const newService = new Service({
        title,
        description,
        contactNumber,
        imageUrl
      });
      await newService.save();
  
      return res.status(200).json({ success: true, message: 'Service added successfully' });
    } catch (error) {
      console.error('Error adding service:', error);
      return res.status(500).json({ success: false, message: 'Server error' });
    }
  });
  router.get('/', async (req, res) => {
    try {
    const cookieHeader = req.headers.cookie;
    const {username} = await authadmin(cookieHeader);
    const services = await Service.find();

        // Return the list of services in the response
        return res.status(200).json({ success: true, services });
    } catch (error) {
      console.error('Error adding service:', error);
      return res.status(500).json({ success: false, message: 'Server error' });
    }
  });

  router.post('/edit/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, contactNumber, image } = req.body;
        
        // Construct the update object dynamically
        const updateObject = {};
        if (title) updateObject.title = title;
        if (description) updateObject.description = description;
        if (contactNumber) updateObject.contactNumber = contactNumber;
        if (image) updateObject.imageUrl = image;

        // Update the service based on its ID with the dynamically constructed update object
        const updatedService = await Service.findByIdAndUpdate(id, updateObject, { new: true });

        if (!updatedService) {
            return res.status(404).json({ success: false, message: 'Service not found' });
        }

        return res.status(200).json({ success: true, updatedService });
    } catch (error) {
        console.error('Error updating service:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
});

router.delete('/delete/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const deletedService = await Service.findByIdAndDelete(id);

        if (!deletedService) {
            return res.status(404).json({ success: false, message: 'Service not found' });
        }

        // If the service is successfully deleted, return a success response
        return res.status(200).json({ success: true, message: 'Service deleted successfully' });
    } catch (error) {
        console.error('Error deleting service:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
});






module.exports = router;
