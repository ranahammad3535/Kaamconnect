/**
 * controllers/uploadController.js — Upload CNIC card image (profile creation step 2)
 *
 * Flow:
 * 1. User registers with POST /register (name, email, password, cnic number, phone)
 * 2. User uploads ONE CNIC card photo with POST /upload-photo
 * 3. Image goes to Cloudinary, URL saved in cnicImageUrl
 */

const cloudinary = require('../config/cloudinary');
const User = require('../models/User');

const uploadToCloudinary = (fileBuffer, folder = 'kaamconnect/cnic') => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'image',
      },
      (error, result) => {
        if (error) {
          return reject(error);
        }
        resolve(result);
      }
    );

    uploadStream.end(fileBuffer);
  });
};

/**
 * POST /upload-photo
 * Upload ONE CNIC card image to complete profile creation.
 * Requires: JWT token + image file (form-data field: cnicImage)
 */
const uploadPhoto = async (req, res) => {
  try {
    if (!process.env.CLOUDINARY_CLOUD_NAME) {
      return res.status(500).json({
        success: false,
        message: 'Cloudinary is not configured. Add CLOUDINARY_* keys to .env file.',
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No CNIC image uploaded. Use form-data with field name "cnicImage" and select your CNIC card photo.',
      });
    }

    // Profile creation allows only ONE CNIC image per user
    if (req.user.cnicImageUrl) {
      return res.status(400).json({
        success: false,
        message: 'CNIC image already uploaded for this profile. Each user can only upload one CNIC photo.',
        cnicImageUrl: req.user.cnicImageUrl,
      });
    }

    const result = await uploadToCloudinary(req.file.buffer);

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { cnicImageUrl: result.secure_url },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: 'CNIC image uploaded successfully. Profile creation complete.',
      cnicImageUrl: result.secure_url,
      profileComplete: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        cnic: user.cnic,
        phone: user.phone,
        cnicImageUrl: user.cnicImageUrl,
        profileComplete: true,
      },
    });
  } catch (error) {
    console.error('CNIC upload error:', error.message);
    res.status(500).json({
      success: false,
      message: 'CNIC image upload failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

module.exports = { uploadPhoto };
