const jwt = require('jsonwebtoken');
const JWT_SECRET = require('../config/jwt');

const verifyToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        message: 'No session token provided.'
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    req.user = decoded;
    next();

  } catch (error) {
    console.error('Session Verification Error:', error.message);

    return res.status(401).json({
      message: 'Invalid or expired session token.'
    });
  }
};

module.exports = verifyToken;
