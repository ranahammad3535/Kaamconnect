/**
 * config/cloudinary.js — Cloudinary setup
 *
 * Cloudinary is a cloud service that stores images online.
 * Instead of saving photos on our server, we upload to Cloudinary
 * and save only the image URL in MongoDB.
 */

const cloudinary = require('cloudinary').v2;

const requiredVars = [
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET',
];

const missing = requiredVars.filter((key) => !process.env[key]);

if (missing.length > 0) {
  console.warn(
    `WARNING: Missing Cloudinary env vars: ${missing.join(', ')}. Photo upload will not work until you add them to .env`
  );
} else {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

module.exports = cloudinary;
