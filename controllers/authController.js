/**
 * controllers/authController.js — Register & Login logic
 */

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: '7d',
  });
};

/**
 * POST /register
 */
const register = async (req, res) => {
  try {
    const { name, email, password, cnic, phone } = req.body;

    const existingEmail = await User.findOne({ email: email.toLowerCase() });
    if (existingEmail) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered. Please login instead.',
      });
    }

    const existingCnic = await User.findOne({ cnic });
    if (existingCnic) {
      return res.status(400).json({
        success: false,
        message: 'CNIC already registered. Each person can only register once.',
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      cnic,
      phone,
    });

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        cnic: user.cnic,
        phone: user.phone,
        cnicImageUrl: user.cnicImageUrl,
        profileComplete: false,
        role: user.role,
      },
      nextStep: 'Upload your CNIC card photo using POST /upload-photo with field name cnicImage',
    });
  } catch (error) {
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern || {})[0];
      const message =
        field === 'cnic'
          ? 'CNIC already registered. Each person can only register once.'
          : 'Email already registered. Please login instead.';

      return res.status(400).json({ success: false, message });
    }

    console.error('Register error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * POST /login
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        cnic: user.cnic,
        phone: user.phone,
        cnicImageUrl: user.cnicImageUrl,
        profileComplete: !!user.cnicImageUrl,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Login error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * GET /api/me — logged-in user's profile
 */
const getMe = async (req, res) => {
  res.status(200).json({
    success: true,
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      cnic: req.user.cnic,
      phone: req.user.phone,
      cnicImageUrl: req.user.cnicImageUrl,
      profileComplete: !!req.user.cnicImageUrl,
      role: req.user.role,
      createdAt: req.user.createdAt,
    },
  });
};

module.exports = {
  register,
  login,
  getMe,
};
