import ApiError from '../utils/ApiError.js';
import { verifyAccessToken } from '../utils/tokenUtils.js';
import User from '../models/User.js';

/**
 * Protect routes - verify JWT access token
 */
export const protect = async (req, res, next) => {
  try {
    let token;

    // Check Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    // Fallback to cookie
    else if (req.cookies && req.cookies.accessToken) {
      token = req.cookies.accessToken;
    }

    if (!token) {
      return next(ApiError.unauthorized('Access denied. No token provided.'));
    }

    // Verify token
    const decoded = verifyAccessToken(token);

    // Find user
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return next(ApiError.unauthorized('User not found. Token invalid.'));
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return next(ApiError.unauthorized('Invalid token.'));
    }
    if (error.name === 'TokenExpiredError') {
      return next(ApiError.unauthorized('Token expired.'));
    }
    next(error);
  }
};

/**
 * Optional auth - attach user if token exists, but don't block
 */
export const optionalAuth = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.accessToken) {
      token = req.cookies.accessToken;
    }

    if (token) {
      const decoded = verifyAccessToken(token);
      const user = await User.findById(decoded.id).select('-password');
      if (user) {
        req.user = user;
      }
    }
  } catch {
    // Silently ignore auth errors for optional auth
  }
  next();
};

/**
 * Role-based authorization
 * @param  {...string} roles - Allowed roles
 */
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(ApiError.unauthorized('Authentication required.'));
    }
    if (!roles.includes(req.user.role)) {
      return next(ApiError.forbidden(`Role '${req.user.role}' is not authorized to access this route.`));
    }
    next();
  };
};
