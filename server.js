/**
 * server.js — Main entry point for KaamConnect backend
 *
 * This file:
 * 1. Loads environment variables from .env
 * 2. Creates the Express app
 * 3. Adds security middleware (helmet, rate limiting)
 * 4. Defines simple test routes
 * 5. Connects to MongoDB Atlas
 * 6. Starts the server on a port (default: 5000)
 *
 * Run with: npm start
 */

// Load .env FIRST — before anything that reads process.env
require('dotenv').config();

const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');

// Database connection function (lives in config/db.js)
const connectDB = require('./config/db');

// Authentication routes (register, login, profile)
const authRoutes = require('./routes/authRoutes');

// Photo upload routes (Cloudinary)
const uploadRoutes = require('./routes/uploadRoutes');

// Create the Express application
const app = express();

// Read port from .env, or use 5000 if not set
const PORT = process.env.PORT || 5000;

// ─── Security Middleware ───────────────────────────────────────────────────

// Helmet sets secure HTTP headers (helps prevent common web attacks)
app.use(helmet());

// Parse JSON bodies — so we can read { "email": "..." } from POST requests
app.use(express.json());

// Parse URL-encoded form data (optional, useful for some clients)
app.use(express.urlencoded({ extended: true }));

// Rate limiting — max 100 requests per 15 minutes per IP address
// Stops someone from spamming your server with thousands of requests
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes in milliseconds
  max: 100,
  message: {
    success: false,
    message: 'Too many requests from this IP. Please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// ─── API Routes ─────────────────────────────────────────────────────────────

// Auth: POST /register, POST /login, GET /api/me
app.use('/', authRoutes);

// Upload: POST /upload-photo (JWT + image file)
app.use('/', uploadRoutes);

// ─── Test Routes (simple checks that the server works) ─────────────────────

/**
 * GET /
 * Root route — open in browser to see if server is alive
 */
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'KaamConnect API is running',
    version: '1.0.0',
    endpoints: {
      health: 'GET /api/health',
      register: 'POST /register',
      login: 'POST /login',
      profile: 'GET /api/me (needs JWT token)',
      uploadCnicImage: 'POST /upload-photo (needs JWT + CNIC card image, field: cnicImage)',
    },
  });
});

/**
 * GET /api/health
 * Health check — useful for monitoring and Postman testing
 */
app.get('/api/health', (req, res) => {
  // mongoose.connection.readyState tells us if DB is connected
  // 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
  const dbStates = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  const dbState = dbStates[mongoose.connection.readyState] || 'unknown';

  res.status(200).json({
    success: true,
    message: 'Server is healthy',
    database: dbState,
    timestamp: new Date().toISOString(),
    uptime: `${Math.floor(process.uptime())} seconds`,
  });
});

/**
 * GET /api/test
 * Another simple test route for your university demo
 */
app.get('/api/test', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Test route works! You can call APIs from Postman.',
    tip: 'Profile creation: register first, then POST /upload-photo with CNIC card image (field: cnicImage).',
  });
});

// ─── 404 Handler (route not found) ─────────────────────────────────────────

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// ─── Global Error Handler ──────────────────────────────────────────────────

app.use((err, req, res, next) => {
  console.error('Server error:', err.message);

  // Multer errors (file too large, wrong type, etc.)
  if (err.name === 'MulterError') {
    return res.status(400).json({
      success: false,
      message: err.code === 'LIMIT_FILE_SIZE' ? 'Image must be smaller than 5 MB' : err.message,
    });
  }

  if (err.message && err.message.includes('Only image files')) {
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }

  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// ─── Start Server ──────────────────────────────────────────────────────────

/**
 * We connect to MongoDB FIRST, then start listening for requests.
 * If MongoDB fails, the server stops — we don't want APIs without a database.
 */
const startServer = async () => {
  // Step 1: Connect to MongoDB Atlas
  await connectDB();

  // Step 2: Start Express server
  const server = app.listen(PORT, () => {
    console.log('=================================');
    console.log('  KaamConnect Backend Started');
    console.log('=================================');
    console.log(`  Server running on port ${PORT}`);
    console.log(`  Local URL: http://localhost:${PORT}`);
    console.log(`  Health check: http://localhost:${PORT}/api/health`);
    console.log('=================================');
  });

  // Friendly message if port is already in use (another npm start is running)
  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`\nERROR: Port ${PORT} is already in use.`);
      console.error('Fix: Close the other terminal running npm start, or press Ctrl+C there.');
      console.error(`Or change PORT in .env to another number (e.g. 5001).\n`);
      process.exit(1);
    }
    throw err;
  });
};

startServer();
