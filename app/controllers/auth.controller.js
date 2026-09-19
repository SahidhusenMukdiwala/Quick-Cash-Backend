import { registerUser, loginUser, logoutUser, forgotPassword as forgotPasswordService, getUserProfile, refreshTokenService, updateUserProfile } from '../services/auth.service.js';
import apiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';

/**
 * Extract public client IP address from headers or socket
 */
const getClientIp = (req) => {
  const forwarded =
    req.headers['x-forwarded-for'] ||
    req.headers['x-real-ip'] ||
    req.headers['cf-connecting-ip'];

  let ip = forwarded;
  if (ip && typeof ip === 'string') {
    const ips = ip.split(',');
    if (ips.length > 0 && ips[0].trim()) {
      ip = ips[0].trim();
    }
  }

  if (!ip) {
    ip = req.ip || req.socket?.remoteAddress || '127.0.0.1';
  }

  // Normalize IPv4-mapped IPv6 (::ffff:127.0.0.1 -> 127.0.0.1) and IPv6 loopback (::1 -> 127.0.0.1)
  if (typeof ip === 'string') {
    if (ip.startsWith('::ffff:')) {
      ip = ip.replace('::ffff:', '');
    }
    if (ip === '::1') {
      ip = '127.0.0.1';
    }
  }

  return ip || '127.0.0.1';
};

/**
 * @desc    Register a new user in user_master
 * @route   POST /api/auth/register
 * @access  Public
 */
export const register = asyncHandler(async (req, res) => {
  const newUser = await registerUser(req.body);
  return res.status(200).json(apiResponse(201, newUser, 'User registered successfully'));
});

/**
 * @desc    Authenticate user & create entry in session_master
 * @route   POST /api/auth/login
 * @access  Public
 */
export const login = asyncHandler(async (req, res) => {
  const ipAddress = getClientIp(req);
  const userAgent = req.headers['user-agent'] || null;
  const { user, access_token, refresh_token } = await loginUser({ ...req.body, ipAddress, userAgent });
  return res.status(200).json(apiResponse(200, { user, access_token, refresh_token }, 'Login successful'));
});

/**
 * @desc    Logout user & remove session from session_master
 * @route   POST /api/auth/logout
 * @access  Private
 */
export const logout = asyncHandler(async (req, res) => {
  const result = await logoutUser(req.token);
  return res.status(200).json(apiResponse(200, null, result.message));
});

/**
 * @desc    Forgot Password - Direct password & confirm password update
 * @route   POST /api/auth/forgot-password
 * @access  Public
 */
export const forgotPassword = asyncHandler(async (req, res) => {
  const result = await forgotPasswordService(req.body);
  return res.status(200).json(apiResponse(200, null, result.message));
});

/**
 * @desc    Get current authenticated user profile from user_master
 * @route   GET /api/auth/profile
 * @access  Private
 */
export const getMe = asyncHandler(async (req, res) => {
  const userProfile = await getUserProfile(req.user.id);
  return res.status(200).json(apiResponse(200, userProfile, 'User profile retrieved successfully'));
});

/**
 * @desc    Update current user profile details
 * @route   PUT /api/auth/profile
 * @access  Private
 */
export const updateProfile = asyncHandler(async (req, res) => {
  const updatedUser = await updateUserProfile(req.user.id, req.body);
  return res.status(200).json(apiResponse(200, updatedUser, 'Profile updated successfully'));
});

/**
 * @desc    Refresh access token using refresh_token
 * @route   POST /api/auth/refresh-token
 * @access  Public
 */
export const refreshToken = asyncHandler(async (req, res) => {
  const refresh_token = req.body?.refresh_token || req.headers['refreshtoken'];
  if (!refresh_token) {
    return res.status(400).json({
      success: false,
      errors: [{ message: 'Refresh token is required' }],
      result: {}
    });
  }

  const result = await refreshTokenService(refresh_token);
  return res.status(200).json(
    apiResponse(200, { access_token: result.access_token }, 'Token refreshed successfully')
  );
});