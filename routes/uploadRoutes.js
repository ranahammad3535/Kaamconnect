/**
 * routes/uploadRoutes.js — CNIC image upload (profile creation)
 *
 * POST /upload-photo — upload ONE CNIC card image (JWT required)
 */

const express = require('express');
const router = express.Router();

const { uploadPhoto } = require('../controllers/uploadController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.post(
  '/upload-photo',
  protect,
  upload.single('cnicImage'),
  uploadPhoto
);

module.exports = router;
