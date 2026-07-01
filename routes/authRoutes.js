/**
 * routes/authRoutes.js — Authentication URL paths
 */

const express = require('express');
const router = express.Router();

const { register, login, getMe } = require('../controllers/authController');
const { registerValidation, loginValidation } = require('../middleware/validateAuth');
const { protect } = require('../middleware/authMiddleware');

router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);
router.get('/api/me', protect, getMe);

module.exports = router;
