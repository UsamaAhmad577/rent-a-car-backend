const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = 'rentacar_jwt_secret_key_2024_usama_dev';

// Authentication middleware
const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid token.' });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token.' });
  }
};

// Admin middleware
const admin = async (req, res, next) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ error: 'Access denied. Admin rights required.' });
    }
    next();
  } catch (error) {
    res.status(500).json({ error: 'Server error in admin check.' });
  }
};

module.exports = { auth, admin };