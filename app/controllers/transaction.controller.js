import {
  createTransaction,
  getAllTransactions,
  getTransactionById,
  updateTransaction,
  deleteTransaction
} from '../services/transaction.service.js';
import apiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';

/**
 * @desc    Create a new transaction
 * @route   POST /api/transactions
 * @access  Private
 */
export const create = asyncHandler(async (req, res) => {
  const transaction = await createTransaction(req.body);
  return res
    .status(201)
    .json(apiResponse(201, transaction, 'Transaction created successfully'));
});

/**
 * @desc    Get all transactions with optional pagination and filters
 * @route   GET /api/transactions
 * @access  Private
 */
export const getAll = asyncHandler(async (req, res) => {
  const result = await getAllTransactions(req.query);
  return res
    .status(200)
    .json(apiResponse(200, result, 'Transactions retrieved successfully'));
});

/**
 * @desc    Get a single transaction by ID
 * @route   GET /api/transactions/:id
 * @access  Private
 */
export const getById = asyncHandler(async (req, res) => {
  const transaction = await getTransactionById(req.params.id);
  return res
    .status(200)
    .json(apiResponse(200, transaction, 'Transaction retrieved successfully'));
});

/**
 * @desc    Update an existing transaction by ID
 * @route   PUT /api/transactions/:id
 * @access  Private
 */
export const update = asyncHandler(async (req, res) => {
  const updatedTransaction = await updateTransaction(req.params.id, req.body);
  return res
    .status(200)
    .json(apiResponse(200, updatedTransaction, 'Transaction updated successfully'));
});

/**
 * @desc    Soft delete a transaction by ID
 * @route   DELETE /api/transactions/:id
 * @access  Private
 */
export const remove = asyncHandler(async (req, res) => {
  const result = await deleteTransaction(req.params.id);
  return res
    .status(200)
    .json(apiResponse(200, result, 'Transaction deleted successfully'));
});
