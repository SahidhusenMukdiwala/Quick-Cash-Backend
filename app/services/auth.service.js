import bcrypt from 'bcryptjs';
import User from '../models/User.model.js';
import Session from '../models/Session.model.js';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/token.utils.js';
import createError from '../utils/ApiError.js';

/**
 * Register a new user in MongoDB users collection
 */
export const registerUser = async ({ name, mobile, password, role = 1 }) => {
  // 1. Check if user with mobile already exists
  const existingUser = await User.findOne({ mobile: mobile.trim(), is_delete: 0 });

  if (existingUser) {
    throw createError(400, 'User with this mobile number already exists');
  }

  // 2. Hash password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  // 3. Insert into users collection
  const newUser = await User.create({
    name: name.trim(),
    mobile: mobile.trim(),
    password: hashedPassword,
    role
  });

  return { id: newUser._id.toString() };
};

/**
 * Login user & save session entry in sessions collection
 */
export const loginUser = async ({ mobile, password, ipAddress, userAgent }) => {
  // 1. Fetch user by mobile
  const user = await User.findOne({ mobile: mobile.trim(), is_delete: 0 });

  if (!user) {
    throw createError(401, 'Invalid mobile number or password');
  }

  // 2. Check user status
  if (user.status !== 1) {
    throw createError(403, 'Account is inactive. Please contact administrator.');
  }

  // 3. Compare password
  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw createError(401, 'Invalid mobile number or password');
  }

  // 4. Generate Access & Refresh tokens
  const tokenPayload = {
    id: user._id.toString(),
    role: user.role
  };

  const accessToken = generateAccessToken(tokenPayload);
  const refreshToken = generateRefreshToken(tokenPayload);

  // 5. Store session in sessions collection
  await Session.create({
    user_id: user._id,
    access_token: accessToken,
    refresh_token: refreshToken,
    ip: ipAddress || '127.0.0.1',
    user_agent: userAgent || null
  });

  // 6. Omit sensitive fields
  const userObj = user.toObject();
  const { password: pass, ...userProfile } = userObj;

  return {
    user: userProfile,
    access_token: accessToken,
    refresh_token: refreshToken
  };
};

/**
 * Logout user by removing token from sessions collection
 */
export const logoutUser = async (accessToken) => {
  await Session.deleteOne({ access_token: accessToken });

  return { message: 'Logged out successfully' };
};

/**
 * Forgot Password - Direct Password & Confirm Password Update against Mobile Number
 */
export const forgotPassword = async ({ mobile, password, confirm_password }) => {
  if (password !== confirm_password) {
    throw createError(400, 'Password and Confirm Password do not match');
  }

  // 1. Check if user exists by mobile
  const user = await User.findOne({ mobile: mobile.trim(), is_delete: 0 });

  if (!user) {
    throw createError(404, 'No account found with this mobile number');
  }

  // 2. Hash new password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  // 3. Update password in users collection
  await User.updateOne({ _id: user._id }, { $set: { password: hashedPassword } });

  // 4. Revoke active sessions in sessions collection
  await Session.deleteMany({ user_id: user._id });

  return { message: 'Password updated successfully. Please log in with your new password.' };
};

/**
 * Get user profile
 */
export const getUserProfile = async (userId) => {
  const user = await User.findOne({ _id: userId, is_delete: 0 }).select('-password');

  if (!user) {
    throw createError(404, 'User not found');
  }

  return user.toObject();
};

/**
 * Refresh access token
 */
export const refreshTokenService = async (refreshToken) => {
  // 1. Fetch session from sessions collection
  const session = await Session.findOne({ refresh_token: refreshToken });

  if (!session) {
    throw createError(401, 'Invalid session or refresh token');
  }

  // 2. Verify refresh token signature & expiration
  let decoded;
  try {
    decoded = verifyRefreshToken(refreshToken);
  } catch (err) {
    // Delete invalid/expired session from database
    await Session.deleteOne({ refresh_token: refreshToken });
    throw createError(401, 'Refresh token expired. Please log in again.');
  }

  // 3. Generate new access token
  const access_token = generateAccessToken({ id: decoded.id, role: decoded.role });

  // 4. Update session with new access_token
  await Session.updateOne({ refresh_token: refreshToken }, { $set: { access_token } });

  return {
    access_token
  };
};

/**
 * Update user profile details
 */
export const updateUserProfile = async (userId, { name, mobile, password }) => {
  // 1. Verify user exists
  const user = await User.findOne({ _id: userId, is_delete: 0 });

  if (!user) {
    throw createError(404, 'User account not found');
  }

  const updateFields = {};

  // 2. If mobile is being changed, verify uniqueness
  if (mobile && mobile.trim()) {
    const mobileCheck = await User.findOne({
      mobile: mobile.trim(),
      _id: { $ne: userId },
      is_delete: 0
    });

    if (mobileCheck) {
      throw createError(400, 'Mobile number is already registered to another account');
    }

    updateFields.mobile = mobile.trim();
  }

  if (name && name.trim()) {
    updateFields.name = name.trim();
  }

  if (password && password.trim()) {
    const salt = await bcrypt.genSalt(10);
    updateFields.password = await bcrypt.hash(password.trim(), salt);
  }

  if (Object.keys(updateFields).length > 0) {
    await User.updateOne({ _id: userId }, { $set: updateFields });
  }

  // 3. Return updated profile
  return await getUserProfile(userId);
};