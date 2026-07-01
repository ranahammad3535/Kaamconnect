/**
 * config/db.js — MongoDB Atlas connection
 *
 * WHY this file exists:
 * - Keeps database connection logic in ONE place
 * - server.js stays clean and easy to read
 * - We can reuse connectDB() if we add tests later
 *
 * HOW it works:
 * - Reads MONGODB_URI from .env (your Atlas connection string)
 * - Uses mongoose to connect to MongoDB
 * - Logs success or stops the server if connection fails
 */

const mongoose = require('mongoose');

/**
 * Connect to MongoDB Atlas
 * @returns {Promise<void>}
 */
const connectDB = async () => {
  // Get connection string from .env file
  const mongoURI = process.env.MONGODB_URI;

  // Safety check — tell user clearly if they forgot to set .env
  if (!mongoURI) {
    console.error('ERROR: MONGODB_URI is missing in your .env file');
    console.error('Please add your MongoDB Atlas connection string to .env');
    process.exit(1); // Stop the server — no point running without a database
  }

  try {
    // Connect to MongoDB
    // mongoose.connect() returns a connection object
    const conn = await mongoose.connect(mongoURI);

    console.log(`MongoDB connected: ${conn.connection.host}`);
    console.log(`Database name: ${conn.connection.name}`);
  } catch (error) {
    console.error('MongoDB connection failed:', error.message);
    console.error('Check your MONGODB_URI, username, password, and IP whitelist in Atlas');
    process.exit(1);
  }
};

module.exports = connectDB;
