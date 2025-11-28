const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey";

// ✅ Allowed domains (bypass token verification)
const ALLOWED_DOMAINS = [
  "https://cybombadmin.cybomb.com",
  "http://localhost:5173",
  "http://localhost:3001",
  "https://rankseo.in"
];

const verifyAdmin = async (req, res, next) => {
  const origin = req.headers.origin;
  const referer = req.headers.referer || "";

  // If request is from allowed domain, skip token check
  if (
    (origin && ALLOWED_DOMAINS.includes(origin)) ||
    ALLOWED_DOMAINS.some((d) => referer.startsWith(d))
  ) {
    console.log("✅ Domain allowed without token:", origin || referer);
    return next();
  }

  // Otherwise, verify JWT token
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Try to find admin by different possible ID paths
    let adminId = decoded.id || decoded._id || decoded.userId;
    
    // If we have a user object in the token, try that too
    if (!adminId && decoded.user) {
      adminId = decoded.user.id || decoded.user._id;
    }

    if (!adminId) {
      return res.status(401).json({ message: 'Token structure invalid' });
    }

    const admin = await Admin.findById(adminId);
    
    if (!admin) {
      return res.status(401).json({ message: 'Token is not valid for admin' });
    }
    
    req.admin = admin;
    next();
  } catch (err) {
    console.error('Token verification error:', err);
    res.status(401).json({ message: 'Token is not valid' });
  }
};

module.exports = { verifyAdmin };