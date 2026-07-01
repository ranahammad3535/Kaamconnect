/**
 * middleware/uploadMiddleware.js — Handle image file uploads
 *
 * Multer reads the photo file from the request (form-data)
 * and puts it in memory (req.file) so we can send it to Cloudinary.
 */

const multer = require('multer');

// Store file in memory (RAM) — not on disk
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed (jpg, png, gif, webp)'), false);
  }
};

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // Max 5 MB
  },
  fileFilter,
});

module.exports = upload;
