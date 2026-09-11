const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authorization token required' });
    }

    const token = authHeader.replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.userId).select('-password');
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    req.user = user;
    req.userRole = user.getRole();
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid or expired token' });
  }
};

const isSuperAdmin = (user) => {
  if (!user) return false;
  const superAdminEmail = process.env.SUPER_ADMIN_EMAIL || process.env.ADMIN_EMAIL;
  return user.getRole() === 'super_admin' || (superAdminEmail && user.email === superAdminEmail);
};

const isAdmin = (user) => {
  if (!user) return false;
  return isSuperAdmin(user) || user.getRole() === 'admin' || user.isAdmin === true;
};

// Middleware: Requires user to be an Admin or Super Admin
const verifyAdmin = [
  authenticate,
  (req, res, next) => {
    if (!isAdmin(req.user)) {
      return res.status(403).json({ message: 'Access denied: Admin privileges required' });
    }
    next();
  }
];

// Middleware: Requires user to be a Super Admin (checks DB role & .env SUPER_ADMIN_EMAIL)
const verifySuperAdmin = [
  authenticate,
  (req, res, next) => {
    if (!isSuperAdmin(req.user)) {
      return res.status(403).json({ message: 'Access denied: Super Admin privileges required' });
    }
    next();
  }
];

const requireRoles = (...roles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  if (!roles.includes(req.userRole) && !isSuperAdmin(req.user)) {
    return res.status(403).json({ message: 'Insufficient permissions' });
  }

  next();
};

module.exports = {
  authenticate,
  verifyAdmin,
  verifySuperAdmin,
  requireRoles,
  isAdmin,
  isSuperAdmin
};

