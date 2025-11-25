const jwt = require('jsonwebtoken');

// ✅ SIMPLE HARDCODED SECRET
const JWT_SECRET = 'rentacar_jwt_secret_key_2024_usama_dev';

const auth = (req, res, next) => {
  try {
    console.log('🔄 AUTH MIDDLEWARE CALLED');
    
    const authHeader = req.header('Authorization');
    console.log('📋 Authorization header:', authHeader);
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No Bearer token provided' });
    }

    const token = authHeader.replace('Bearer ', '').trim();
    console.log('🔐 Token extracted:', token);
    
    if (!token) {
      return res.status(401).json({ error: 'No token found' });
    }

    console.log('🔑 Verifying with secret:', JWT_SECRET);
    
    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log('✅ Token decoded successfully:', decoded);
    
    // Extract user ID
    const userId = decoded.userId || decoded.id;
    console.log('👤 User ID extracted:', userId);
    
    if (!userId) {
      return res.status(401).json({ error: 'No user ID in token' });
    }
    
    req.user = { id: userId };
    console.log('🎯 Request user set to:', req.user);
    
    next();
    
  } catch (error) {
    console.error('❌ JWT Verification Failed:', error.message);
    console.error('🔍 Full error:', error);
    res.status(401).json({ error: 'Token is not valid: ' + error.message });
  }
};

module.exports = auth;