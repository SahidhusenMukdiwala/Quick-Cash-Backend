import express from 'express';
import { register, login, logout, forgotPassword, getMe, updateProfile, refreshToken } from '../controllers/auth.controller.js';
import validate from '../middlewares/validate.middleware.js';
import { verifyToken } from '../middlewares/auth.middleware.js';
import { registerSchema, loginSchema, forgotPasswordSchema, updateProfileSchema } from '../validations/auth.validation.js';

const router = express.Router();

// Public Routes
router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.post('/forgot-password', validate(forgotPasswordSchema), forgotPassword);
router.post('/refresh-token', refreshToken);

// Protected Routes (Requires active session in session_master)
router.post('/logout', verifyToken, logout);
router.get('/profile', verifyToken, getMe);
router.put('/profile', verifyToken, validate(updateProfileSchema), updateProfile);

export default router;
