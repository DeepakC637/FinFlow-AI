const rateLimit = require('express-rate-limit');

// Bounded limits with environment variable overrides
const AUTH_LIMIT = process.env.AUTH_RATE_LIMIT 
  ? Number(process.env.AUTH_RATE_LIMIT) 
  : (process.env.NODE_ENV === 'test' ? 100 : 30);

const SCAN_LIMIT = process.env.SCAN_RATE_LIMIT 
  ? Number(process.env.SCAN_RATE_LIMIT) 
  : (process.env.NODE_ENV === 'test' ? 50 : 15);

// Rate limiter for authentication routes (login / register)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15-minute window
  limit: AUTH_LIMIT,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: 'Too many authentication attempts from this IP. Please try again after 15 minutes.'
    });
  }
});

// Rate limiter for AI receipt scanning & OCR
const scanLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15-minute window
  limit: SCAN_LIMIT,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: 'Too many invoice scan requests from this IP. Please wait before scanning additional receipts.'
    });
  }
});

// Dedicated low-threshold limiter for automated security tests
const testLimiter = rateLimit({
  windowMs: 10 * 1000, // 10 seconds
  limit: 3,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: 'Rate limit exceeded for test verification.'
    });
  }
});

module.exports = { authLimiter, scanLimiter, testLimiter };
