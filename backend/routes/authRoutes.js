const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/authMiddleware');
const {
  getMe,
  signup,
  login,
  logout
} = require('../controllers/authController');
const {
  sendSignupOtp,
  verifySignupOtp
} = require('../controllers/otpController');

// Session route
router.get('/me', verifyToken, getMe);

// OTP routes
router.post('/send-signup-otp', sendSignupOtp);
router.post('/verify-signup-otp', verifySignupOtp);

// Auth routes
router.post('/signup', signup);
router.post('/login', login);
router.post('/logout', logout);

module.exports = router;
