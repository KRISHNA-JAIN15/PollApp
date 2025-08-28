const express = require('express');
const UserController = require('../controllers/userController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get user profile
router.get('/profile', authenticateToken, UserController.getProfile);

// Get user statistics
router.get('/stats', authenticateToken, UserController.getStats);

// Get all users (for admin purposes)
router.get('/', UserController.getAllUsers);

module.exports = router;
