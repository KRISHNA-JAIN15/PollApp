const express = require('express');
const { body, validationResult } = require('express-validator');
const AuthController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

const validateRegister = [
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
];

const validateLogin = [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required')
];

const validateVerifyEmail = [
  body('email').isEmail().withMessage('Valid email is required'),
  body('verificationCode').isLength({ min: 6, max: 6 }).withMessage('Verification code must be 6 digits')
];

const validateResendVerification = [
  body('email').isEmail().withMessage('Valid email is required')
];

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      success: false, 
      errors: errors.array() 
    });
  }
  next();
};

router.post('/register', validateRegister, handleValidationErrors, AuthController.register);

router.post('/verify', validateVerifyEmail, handleValidationErrors, AuthController.verifyEmail);

router.post('/resend-verification', validateResendVerification, handleValidationErrors, AuthController.resendVerificationCode);

router.post('/login', validateLogin, handleValidationErrors, AuthController.login);

router.post('/logout', AuthController.logout);

router.post('/refresh', authenticateToken, AuthController.refreshToken);

module.exports = router;
