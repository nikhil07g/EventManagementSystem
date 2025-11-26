const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

const respondUnauthorized = (res, status, message) =>
  res.status(status).json({ success: false, message });

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return respondUnauthorized(res, 401, 'Access token required.');
  }

  jwt.verify(token, JWT_SECRET, (error, decoded) => {
    if (error) {
      return respondUnauthorized(res, 403, 'Invalid or expired token.');
    }
    req.user = decoded;
    return next();
  });
};

const requireRole = (roles) => {
  const allowedRoles = Array.isArray(roles) ? roles : [roles];
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return respondUnauthorized(res, 403, 'Access denied.');
    }
    return next();
  };
};

module.exports = { authenticateToken, requireRole };