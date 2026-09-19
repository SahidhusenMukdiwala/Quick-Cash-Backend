import mongoose from 'mongoose';
import { verifyAccessToken } from '../utils/token.utils.js';
import Session from '../models/Session.model.js';
import User from '../models/User.model.js';
import createError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';

/**
 * Authentication Middleware using sessions & users collection
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

  if (!mongoose.Types.ObjectId.isValid(decodedPayload.id)) {
    throw createError(401, 'Unauthorized: Invalid token payload');
  }

  // 2. Verify token exists in sessions collection
  const session = await Session.findOne({
    access_token: token,
    user_id: decodedPayload.id
  });

  if (!session) {
    throw createError(401, 'Session expired or logged out. Please log in again.');
  }

  // 3. Verify user is active in users collection
  const user = await User.findOne({
    _id: decodedPayload.id,
    is_delete: 0
  }).select('name mobile role status createdAt modifiedAt');

  if (!user || user.status !== 1) {
    throw createError(401, 'User account is inactive or deleted');
  }

  req.user = user.toObject();
  req.token = token;

  next();
});
