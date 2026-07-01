/**
 * middleware/authMiddleware.js — Protect routes with JWT
 *
 * HOW JWT works (simple):
 * 1. User logs in → server gives them a "token" (like a temporary ID card)
 * 2. User sends token in header: Authorization: Bearer <token>
 * 3. This middleware checks if token is valid
 * 4. If valid → allow request. If not → block with 401 error
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Verify JWT token and attach user to request
 */
const protect = async (req, res, next) => {
  try {
    let token;

    // Read token from Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized. Please login and send your token.',
      });
    }

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({
        success: false,
        message: 'Server error: JWT_SECRET is missing in .env',
      });
    }

    // Verify token — throws error if expired or tampered
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Find user (password excluded because of select: false in model)
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found. Token may be invalid.',
      });
    }

    // Attach user to request so controllers can use req.user
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized. Token is invalid or expired.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * Only allow admin users
 */
const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    return next();
  }

  return res.status(403).json({
    success: false,
    message: 'Access denied. Admin only.',
  });
};

module.exports = { protect, adminOnly };
