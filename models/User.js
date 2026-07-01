/**
 * models/User.js — User database schema
 *
 * Profile creation fields:
 * - name, email, password, cnic (number), phone
 * - cnicImageUrl — ONE photo of the CNIC card (uploaded via Cloudinary)
 */

const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false,
    },
    cnic: {
      type: String,
      required: [true, 'CNIC is required'],
      unique: true,
      trim: true,
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
    },
    // Single CNIC card image URL from Cloudinary (not a profile selfie)
    cnicImageUrl: {
      type: String,
      default: null,
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('User', userSchema);
