/**
 * middleware/validateAuth.js — Input validation for register & login
 *
 * WHY validate?
 * - Stop bad data before it reaches the database
 * - Return clear error messages to the user
 */

const { body, validationResult } = require('express-validator');

/**
 * If validation fails, send error response and stop
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map((err) => ({
        field: err.path,
        message: err.msg,
      })),
    });
  }

  next();
};

/**
 * Rules for POST /register
 */
const registerValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  body('cnic')
    .matches(/^\d{5}-\d{7}-\d{1}$/)
    .withMessage('CNIC format must be 12345-1234567-1'),
  body('phone')
    .matches(/^03\d{9}$/)
    .withMessage('Phone must be a valid Pakistani number like 03001234567'),
  handleValidationErrors,
];

/**
 * Rules for POST /login
 */
const loginValidation = [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').notEmpty().withMessage('Password is required'),
  handleValidationErrors,
];

module.exports = { registerValidation, loginValidation };
