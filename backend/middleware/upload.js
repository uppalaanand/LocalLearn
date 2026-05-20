import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import config from '../config/index.js';

// Configure Cloudinary
cloudinary.config({
  cloud_name: config.cloudinary.cloudName,
  api_key: config.cloudinary.apiKey,
  api_secret: config.cloudinary.apiSecret,
});

// File filter - only allow images
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'), false);
  }
};

// Multer memory storage (buffer stays in memory, then we upload to Cloudinary)
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: {
    fileSize: config.maxFileSize || 5 * 1024 * 1024, // 5MB default
  },
});

/**
 * Upload a buffer to Cloudinary and return the secure URL
 * @param {Buffer} buffer - The image buffer
 * @param {string} folder - Cloudinary folder name
 * @returns {Promise<string>} - The secure URL of the uploaded image
 */
export const uploadToCloudinary = (buffer, folder = 'locallearn/classes') => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'image',
        transformation: [
          { width: 800, height: 600, crop: 'limit', quality: 'auto' },
        ],
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result.secure_url);
      }
    );
    stream.end(buffer);
  });
};

// Middleware to accept up to 5 photos
export const uploadPhotos = upload.array('photos', 5);

export default upload;
