import bcrypt from 'bcryptjs';
import { executeQuery } from '../utils/db.js';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/token.utils.js';
import createError from '../utils/ApiError.js';

/**
 * Register a new user in user_master
 */
export const registerUser = async ({ name, mobile, password, role = 1 }) => {
  // 1. Check if user with mobile already exists
  const existingUsers = await executeQuery({
    query: 'SELECT id FROM user_master WHERE mobile = ? AND is_delete = 0',
    values: [mobile.trim()]
  });

  if (existingUsers.length > 0) {
    throw createError(400, 'User with this mobile number already exists');
  }

  // 2. Hash password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  // 3. Insert into user_master
  const result = await executeQuery({
    query: `
      INSERT INTO user_master (name, mobile, password, role)
      VALUES (?, ?, ?, ?)
    `,
    values: [name.trim(), mobile.trim(), hashedPassword, role]
  });

  return { id: result.insertId };
};

/**
 * Login user & save session entry in session_master
 */
export const loginUser = async ({ mobile, password, ipAddress }) => {
  // 1. Fetch user by mobile
  const users = await executeQuery({
    query: 'SELECT * FROM user_master WHERE mobile = ? AND is_delete = 0',
    values: [mobile.trim()]
  });

  if (users.length === 0) {
    throw createError(401, 'Invalid mobile number or password');
  }

  const user = users[0];

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
    id: user.id,
    role: user.role
  };

  const accessToken = generateAccessToken(tokenPayload);
  const refreshToken = generateRefreshToken(tokenPayload);

  // 5. Store session in session_master table
  await executeQuery({
    query: `
      INSERT INTO session_master (user_id, access_token, refresh_token, ip)
      VALUES (?, ?, ?, ?)
    `,
    values: [user.id, accessToken, refreshToken, ipAddress || '127.0.0.1']
  });

  // 6. Omit sensitive fields
  const { password: pass, ...userProfile } = user;

  return {
    user: userProfile,
    access_token: accessToken,
    refresh_token: refreshToken
  };
};

/**
 * Logout user by removing token from session_master
 */
export const logoutUser = async (accessToken) => {
  await executeQuery({
    query: 'DELETE FROM session_master WHERE access_token = ?',
    values: [accessToken]
  });

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
  const users = await executeQuery({
    query: 'SELECT id FROM user_master WHERE mobile = ? AND is_delete = 0',
    values: [mobile.trim()]
  });

  if (users.length === 0) {
    throw createError(404, 'No account found with this mobile number');
  }

  const userId = users[0].id;

  // 2. Hash new password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  // 3. Update password in user_master
  await executeQuery({
    query: 'UPDATE user_master SET password = ? WHERE id = ? AND is_delete = 0',
    values: [hashedPassword, userId]
  });

  // 4. Revoke active sessions in session_master
  await executeQuery({
    query: 'DELETE FROM session_master WHERE user_id = ?',
    values: [userId]
  });

  return { message: 'Password updated successfully. Please log in with your new password.' };
};

/**
 * Get user profile
 */
export const getUserProfile = async (userId) => {
  const users = await executeQuery({
    query: 'SELECT id, name, mobile, role, status, createdAt, modifiedAt FROM user_master WHERE id = ? AND is_delete = 0',
    values: [userId]
  });

  if (users.length === 0) {
    throw createError(404, 'User not found');
  }

  return users[0];
};

export const refreshTokenService = async (refreshToken) => {
  // 1. Fetch session from session_master
  const getSessions = await executeQuery({
    query: 'SELECT * FROM session_master WHERE refresh_token = ?',
    values: [refreshToken]
  });

  if (getSessions.length === 0) {
    throw createError(401, 'Invalid session or refresh token');
  }

  // 2. Verify refresh token signature & expiration
  let decoded;
  try {
    decoded = verifyRefreshToken(refreshToken);
  } catch (err) {
    // Delete invalid/expired session from database
    await executeQuery({
      query: 'DELETE FROM session_master WHERE refresh_token = ?',
      values: [refreshToken]
    });
    throw createError(401, 'Refresh token expired. Please log in again.');
  }

  // 3. Generate new access token
  const access_token = generateAccessToken({ id: decoded.id, role: decoded.role });

  // 4. Update session_master with new access_token
  const updateSessionQuery = `UPDATE session_master SET access_token = ? WHERE refresh_token = ?`;
  await executeQuery({ query: updateSessionQuery, values: [access_token, refreshToken] });

  return {
    access_token
  };
};

/**
 * Update user profile details
 */
export const updateUserProfile = async (userId, { name, mobile, password }) => {
  // 1. Verify user exists
  const existingUsers = await executeQuery({
    query: 'SELECT * FROM user_master WHERE id = ? AND is_delete = 0',
    values: [userId]
  });

  if (existingUsers.length === 0) {
    throw createError(404, 'User account not found');
  }

  const updates = [];
  const values = [];

  // 2. If mobile is being changed, verify uniqueness
  if (mobile && mobile.trim()) {
    const mobileCheck = await executeQuery({
      query: 'SELECT id FROM user_master WHERE mobile = ? AND id != ? AND is_delete = 0',
      values: [mobile.trim(), userId]
    });

    if (mobileCheck.length > 0) {
      throw createError(400, 'Mobile number is already registered to another account');
    }

    updates.push('mobile = ?');
    values.push(mobile.trim());
  }

  if (name && name.trim()) {
    updates.push('name = ?');
    values.push(name.trim());
  }

  if (password && password.trim()) {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password.trim(), salt);
    updates.push('password = ?');
    values.push(hashedPassword);
  }

  if (updates.length > 0) {
    values.push(userId);
    await executeQuery({
      query: `UPDATE user_master SET ${updates.join(', ')} WHERE id = ?`,
      values
    });
  }

  // 3. Return updated profile
  return await getUserProfile(userId);
};