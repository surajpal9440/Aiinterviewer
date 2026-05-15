/**
 * auth.js — JWT Authentication Middleware
 * Mirrors Java JwtAuthFilter behavior.
 */

const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-key';

/**
 * Generate JWT token for a user
 */
function generateToken(userId, username) {
  const expirationMs = parseInt(process.env.JWT_EXPIRATION) || 86400000;
  return jwt.sign(
    { userId, username },
    JWT_SECRET,
    { expiresIn: Math.floor(expirationMs / 1000) } // jwt lib uses seconds
  );
}

/**
 * Middleware to verify JWT token
 * Attaches userId to req.userId if valid
 */
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized. Please login.' });
  }

  const token = authHeader.substring(7);

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    req.username = decoded.username;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
}

module.exports = { generateToken, authMiddleware };
