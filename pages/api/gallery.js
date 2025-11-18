// pages/api/gallery.js
import { getGalleryImages } from '../../utils/db';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const limit = parseInt(req.query.limit) || 20;
    const images = await getGalleryImages(limit);

    res.status(200).json({ 
      message: 'Gallery images retrieved successfully',
      images 
    });
  } catch (error) {
    console.error('Gallery error:', error);
    res.status(500).json({ message: 'Error retrieving gallery images', error: error.message });
  }
}


