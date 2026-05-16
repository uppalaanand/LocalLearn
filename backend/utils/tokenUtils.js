import jwt from 'jsonwebtoken';
import config from '../config/index.js';

/**
 * Generate JWT access token (short-lived)
 */
export const generateAccessToken = (userId, role) => {
  return jwt.sign(
    { id: userId, role },
    config.jwt.accessSecret,
    { expiresIn: config.jwt.accessExpire }
  );
};

/**
 * Generate JWT refresh token (long-lived)
 */
export const generateRefreshToken = (userId) => {
  return jwt.sign(
    { id: userId },
    config.jwt.refreshSecret,
    { expiresIn: config.jwt.refreshExpire }
  );
};

/**
 * Verify access token
 */
export const verifyAccessToken = (token) => {
  return jwt.verify(token, config.jwt.accessSecret);
};

/**
 * Verify refresh token
 */
export const verifyRefreshToken = (token) => {
  return jwt.verify(token, config.jwt.refreshSecret);
};
