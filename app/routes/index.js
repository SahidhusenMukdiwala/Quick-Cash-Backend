import express from 'express';
import authRoutes from './auth.routes.js';
import transactionRoutes from './transaction.routes.js';

const router = express.Router();
router.use('/auth', authRoutes);
router.use('/transactions', transactionRoutes);

export default router;
