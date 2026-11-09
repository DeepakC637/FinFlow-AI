const jwt = require('jsonwebtoken');

// Since persistent user database has been completely removed:
// Protected endpoints fail closed: token presence cannot prove an active user account or valid role.
const protect = async (req, res, next) => {
  let token;

  if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ 
      success: false, 
      message: 'Not authorized, no token' 
    });
  }

  // Fail closed: No trusted database exists to verify user account status or permissions
  return res.status(503).json({
    success: false,
    message: 'Authentication service unavailable: persistent user database has been removed. Protected operations cannot be verified.'
  });
};

const authorize = (...roles) => {
  return (req, res, next) => {
    return res.status(503).json({ 
      success: false,
      message: 'Role authorization unavailable: persistent user database has been removed.' 
    });
  };
};

// Optional protect for ephemeral endpoints like OCR scanning:
// Continues unauthenticated without requiring database lookup.
const optionalProtect = async (req, res, next) => {
  req.user = null;
  next();
};

module.exports = { protect, authorize, optionalProtect };
