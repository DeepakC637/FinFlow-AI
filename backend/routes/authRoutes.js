const express = require('express');
const router = express.Router();
const {
  registerUser,
  loginUser,
  logoutUser,
  getMe,
  updateUserProfile,
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { authLimiter, testLimiter } = require('../middleware/rateLimiter');

router.post('/register', authLimiter, registerUser);
router.post('/login', authLimiter, loginUser);
router.get('/logout', logoutUser);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateUserProfile);

// Dedicated verification endpoint for testing rate-limiting behavior
router.get('/test-rate-limit', testLimiter, (req, res) => {
  res.status(200).json({ success: true, message: 'Request permitted within rate limits.' });
});

module.exports = router;
