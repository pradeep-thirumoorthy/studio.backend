import { Router } from 'express';
import { Gallery, User } from '../schema.js';
import authuser from './auth.js';

const router = Router();

// Route to list all images in the user's gallery
router.get('/', async (req, res) => {
  try {
    // Get the token from the cookie header
    
    const cookieHeader = req.headers.cookie;
    const { username } = await authuser(cookieHeader);

    // Find the user by username to get the userId
    const user = await User.findOne({ username });

    // Check if user exists
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Get the userId
    const userId = user._id;

    // Find all images in the gallery for the userId
    const userGallery = await Gallery.find({ userId });

    // Extract necessary fields from userGallery
    const images = userGallery.map(img => ({
      id: img._id, // Include the _id of each image
      image: img.image // Include the image URL
    }));
    // Return only the image URLs
    return res.status(200).json({ success: true, images: images });
  } catch (error) {
    console.error('Error fetching user gallery:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});
router.delete('/Delete/:id', async (req, res) => {
  try {
    // Get the token from the cookie header
    const cookieHeader = req.headers.cookie;
    const { username } = await authuser(cookieHeader);

    // Find the user by username to get the userId
    const user = await User.findOne({ username });

    // Check if user exists
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Get the userId
    const userId = user._id;

    // Find the image in the gallery for the userId by its ID
    const deletedImage = await Gallery.findByIdAndDelete(req.params.id);

    // Check if the image exists
    if (!deletedImage) {
      return res.status(404).json({ success: false, message: 'Image not found' });
    }

    // Return success message
    return res.status(200).json({ success: true, message: 'Image deleted successfully' });
  } catch (error) {
    console.error('Error deleting image:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});


export default router;
