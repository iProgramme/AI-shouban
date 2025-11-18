// pages/api/generate.js
import { verifyRedemptionCode, useRedemptionCode, saveGeneratedImage } from '../../utils/db';
import formidable from 'formidable';
import fs from 'fs/promises';
import path from 'path';

export const config = {
  api: {
    bodyParser: false, // Disable body parsing for file uploads
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Parse the form data
    const form = new formidable.IncomingForm();
    form.maxFileSize = 5 * 1024 * 1024; // 5MB limit
    form.uploadDir = path.join(process.cwd(), 'public/uploads');
    form.keepExtensions = true;

    // Ensure upload directory exists
    await fs.mkdir(form.uploadDir, { recursive: true });

    const { fields, files } = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) {
          reject(err);
        } else {
          resolve({ fields, files });
        }
      });
    });

    const code = Array.isArray(fields.code) ? fields.code[0] : fields.code;
    const imageFile = Array.isArray(files.image) ? files.image[0] : files.image;

    if (!code) {
      return res.status(400).json({ message: 'Redemption code is required' });
    }

    if (!imageFile) {
      return res.status(400).json({ message: 'Image file is required' });
    }

    // Verify the redemption code
    const verificationResult = await verifyRedemptionCode(code);
    if (!verificationResult.valid) {
      return res.status(400).json({ message: verificationResult.error });
    }

    // Process the image (in a real implementation, this would call an AI service)
    // For now, we'll save the uploaded file and create a placeholder for generated image
    const originalImagePath = imageFile.filepath;
    const fileExtension = path.extname(imageFile.originalFilename);
    const timestamp = Date.now();
    const originalFileName = `original_${timestamp}${fileExtension}`;
    const generatedFileName = `generated_${timestamp}${fileExtension}`;
    
    // Move original file to public/uploads
    const originalPublicPath = `/uploads/${originalFileName}`;
    const originalPublicFullPath = path.join(process.cwd(), 'public', originalPublicPath);
    await fs.copyFile(originalImagePath, originalPublicFullPath);
    
    // Create a "generated" image path (in a real app, this would be the AI-generated image)
    // For demo purposes, we'll just use the same file
    const generatedPublicPath = `/uploads/${generatedFileName}`;
    const generatedPublicFullPath = path.join(process.cwd(), 'public', generatedPublicPath);
    
    // For this demo, we'll just copy the original file as "generated"
    // In a real application, you'd call an AI service to generate the hand figurine image
    await fs.copyFile(originalImagePath, generatedPublicFullPath);

    // Mark the redemption code as used
    await useRedemptionCode(verificationResult.id);

    // Save the generated image record
    await saveGeneratedImage(
      originalPublicPath,
      generatedPublicPath,
      verificationResult.userId,
      verificationResult.id
    );

    res.status(200).json({ 
      message: 'Image generated successfully', 
      generatedImageUrl: generatedPublicPath,
      originalImageUrl: originalPublicPath
    });
  } catch (error) {
    console.error('Image generation error:', error);
    res.status(500).json({ message: 'Error generating image', error: error.message });
  }
}


