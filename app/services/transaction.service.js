import mongoose from 'mongoose';
import Transaction from '../models/Transaction.model.js';
import createError from '../utils/ApiError.js';

/**
 * Create a new transaction (type: 1 = Cash In, 2 = Cash Out)
 */
export const createTransaction = async ({
  type = 1,
  paid_to = null,
  amount,
  payment_mode,
  remark = null,
  transaction_date
}) => {
  const transaction = await Transaction.create({
    type,
    paid_to: paid_to ? paid_to.trim() : null,
    amount,
    payment_mode,
    remark: remark ? remark.trim() : null,
    transaction_date: new Date(transaction_date)
  });

  return getTransactionById(transaction._id.toString());
};

/**
 * Get all transactions (filtering out soft deleted ones) with default 20 records per page
 */
export const getAllTransactions = async (queryParams = {}) => {
  const { page = 1, limit = 20, type, payment_mode, start_date, end_date, search } = queryParams;

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 20));
  const offset = (pageNum - 1) * limitNum;

  const filter = { is_deleted: 0 };

  if (type !== undefined && type !== '') {
    filter.type = parseInt(type, 10);
  }

  if (payment_mode !== undefined && payment_mode !== '') {
    filter.payment_mode = parseInt(payment_mode, 10);
  }

  if (start_date || end_date) {
    filter.transaction_date = {};
    if (start_date) {
      filter.transaction_date.$gte = new Date(start_date);
    }
    if (end_date) {
      const endOfDay = new Date(end_date);
      endOfDay.setHours(23, 59, 59, 999);
      filter.transaction_date.$lte = endOfDay;
    }
  }

  if (search && search.trim()) {
    const escapedSearch = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escapedSearch, 'i');
    filter.$or = [{ paid_to: regex }, { remark: regex }];
  }

  const isExport = queryParams.export === 'true' || queryParams.is_export === 'true';

  let dataQuery = Transaction.find(filter).sort({ transaction_date: -1, _id: -1 });

  if (!isExport) {
    dataQuery = dataQuery.skip(offset).limit(limitNum);
  }

  const countPromise = Transaction.countDocuments(filter);

  const summaryPromise = Transaction.aggregate([
    { $match: filter },
    {
      $group: {
        _id: null,
        totalCashIn: {
          $sum: {
            $cond: [{ $eq: ['$type', 1] }, '$amount', 0]
          }
        },
        totalCashOut: {
          $sum: {
            $cond: [{ $eq: ['$type', 2] }, '$amount', 0]
          }
        }
      }
    }
  ]);

  // Execute count, summary, and data in parallel
  const [totalRecords, summaryResult, docs] = await Promise.all([
    countPromise,
    summaryPromise,
    dataQuery.exec()
  ]);

  const transactions = docs.map((doc) => doc.toObject());
  const totalPages = Math.ceil(totalRecords / limitNum);
  const totalCashIn = Number(summaryResult[0]?.totalCashIn || 0);
  const totalCashOut = Number(summaryResult[0]?.totalCashOut || 0);
  const netBalance = totalCashIn - totalCashOut;

  return {
    transactions,
    summary: {
      totalCashIn,
      totalCashOut,
      netBalance
    },
    pagination: {
      totalRecords,
      totalPages,
      currentPage: pageNum,
      limit: limitNum
    }
  };
};

/**
 * Get single transaction by ID
 */
export const getTransactionById = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw createError(404, 'Transaction not found');
  }

  const transaction = await Transaction.findOne({ _id: id, is_deleted: 0 });

  if (!transaction) {
    throw createError(404, 'Transaction not found');
  }

  return transaction.toObject();
};

/**
 * Update transaction by ID
 */
export const updateTransaction = async (id, updatedFields) => {
  // Verify transaction exists
  await getTransactionById(id);

  const allowedFields = ['type', 'paid_to', 'amount', 'payment_mode', 'remark', 'transaction_date'];
  const updateData = {};

  for (const field of allowedFields) {
    if (updatedFields[field] !== undefined) {
      if (field === 'transaction_date') {
        updateData.transaction_date = new Date(updatedFields.transaction_date);
      } else if (typeof updatedFields[field] === 'string') {
        updateData[field] = updatedFields[field].trim();
      } else {
        updateData[field] = updatedFields[field];
      }
    }
  }

  if (Object.keys(updateData).length === 0) {
    throw createError(400, 'No valid fields provided for update.');
  }

  await Transaction.updateOne({ _id: id, is_deleted: 0 }, { $set: updateData });

  return getTransactionById(id);
};

/**
 * Soft delete transaction by ID
 */
export const deleteTransaction = async (id) => {
  // Verify transaction exists
  await getTransactionById(id);

  await Transaction.updateOne({ _id: id, is_deleted: 0 }, { $set: { is_deleted: 1 } });

  return { message: 'Transaction deleted successfully', id };
};
