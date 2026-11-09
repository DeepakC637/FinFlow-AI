// @desc    Register a new user
// @route   POST /api/v1/auth/register
// @access  Public
const registerUser = async (req, res) => {
  return res.status(503).json({
    success: false,
    message: 'User registration is unavailable: persistent database storage has been removed.'
  });
};

// @desc    Authenticate a user
// @route   POST /api/v1/auth/login
// @access  Public
const loginUser = async (req, res) => {
  return res.status(503).json({
    success: false,
    message: 'User login is unavailable: persistent database storage has been removed.'
  });
};

// @desc    Logout user / clear cookie
// @route   GET /api/v1/auth/logout
// @access  Public
const logoutUser = (req, res) => {
  res.cookie('token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    expires: new Date(0),
  });
  return res.status(200).json({ 
    success: true, 
    message: 'Logged out successfully' 
  });
};

// @desc    Get user profile
// @route   GET /api/v1/auth/me
// @access  Private
const getMe = async (req, res) => {
  return res.status(503).json({
    success: false,
    message: 'User profile is unavailable: persistent database storage has been removed.'
  });
};

// @desc    Update user profile
// @route   PUT /api/v1/auth/profile
// @access  Private
const updateUserProfile = async (req, res) => {
  return res.status(503).json({
    success: false,
    message: 'Profile persistence is unavailable: persistent database storage has been removed.'
  });
};

module.exports = {
  registerUser,
  loginUser,
  logoutUser,
  getMe,
  updateUserProfile,
};
