import { verifyAccessToken } from '../utils/token.utils.js';
import { executeQuery } from '../utils/db.js';
import createError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';

/**
 * Authentication Middleware using session_master & user_master
 */
export const verifyToken = asyncHandler(async (req, res, next) => {
  let token = null;

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }

  if (!token) {
    throw createError(401, 'Unauthorized: Access token missing');
  }

  // 1. Decode Access Token
  let decodedPayload;
  try {
    decodedPayload = verifyAccessToken(token);
  } catch (err) {
    throw createError(401, 'Unauthorized: Invalid or expired access token');
  }

  // 2. Verify token exists in session_master table
  const sessions = await executeQuery({
    query: 'SELECT id FROM session_master WHERE access_token = ? AND user_id = ?',
    values: [token, decodedPayload.id]
  });

  if (sessions.length === 0) {
    throw createError(401, 'Session expired or logged out. Please log in again.');
  }

  // 3. Verify user is active in user_master
  const users = await executeQuery({
    query: 'SELECT id, name, mobile, role, status FROM user_master WHERE id = ? AND is_delete = 0',
    values: [decodedPayload.id]
  });

  if (users.length === 0 || users[0].status !== 1) {
    throw createError(401, 'User account is inactive or deleted');
  }

  req.user = users[0];
  req.token = token;

  next();
});
