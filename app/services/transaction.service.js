import { executeQuery } from '../utils/db.js';
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
  const query = `
    INSERT INTO transactions (type, paid_to, amount, payment_mode, remark, transaction_date)
    VALUES (?, ?, ?, ?, ?, ?)
  `;
  const values = [
    type,
    paid_to ? paid_to.trim() : null,
    amount,
    payment_mode,
    remark ? remark.trim() : null,
    transaction_date
  ];

  const result = await executeQuery({ query, values });

  return getTransactionById(result.insertId);
};

/**
 * Get all transactions (filtering out soft deleted ones) with default 20 records per page
 */
export const getAllTransactions = async (queryParams = {}) => {
  const { page = 1, limit = 20, type, payment_mode, start_date, end_date, search } = queryParams;

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  // Default limit is 20 records per page as requested
  const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 20));
  const offset = (pageNum - 1) * limitNum;

  let whereClauses = ['is_deleted = 0'];
  let values = [];

  if (type !== undefined && type !== '') {
    whereClauses.push('type = ?');
    values.push(parseInt(type, 10));
  }

  if (payment_mode !== undefined && payment_mode !== '') {
    whereClauses.push('payment_mode = ?');
    values.push(parseInt(payment_mode, 10));
  }

  if (start_date) {
    whereClauses.push('transaction_date >= ?');
    values.push(start_date);
  }

  if (end_date) {
    whereClauses.push('transaction_date <= ?');
    values.push(end_date);
  }

  if (search) {
    whereClauses.push('(paid_to LIKE ? OR remark LIKE ?)');
    const searchPattern = `%${search.trim()}%`;
    values.push(searchPattern, searchPattern);
  }

  const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

  // Prepare SQL queries
  const countQuery = `SELECT COUNT(*) AS total FROM transactions ${whereSql}`;
  const summaryQuery = `
    SELECT 
      SUM(CASE WHEN type = 1 THEN amount ELSE 0 END) AS totalCashIn,
      SUM(CASE WHEN type = 2 THEN amount ELSE 0 END) AS totalCashOut
    FROM transactions
    ${whereSql}
  `;
  const dataQuery = `
    SELECT id, type, paid_to, amount, payment_mode, remark, transaction_date, is_deleted, createdAt, updatedAt
    FROM transactions
    ${whereSql}
    ORDER BY transaction_date DESC, id DESC
    LIMIT ? OFFSET ?
  `;
  const dataValues = [...values, limitNum, offset];

  // Execute Count, Summary, and Data queries in parallel for high performance
  const [countResult, summaryResult, transactions] = await Promise.all([
    executeQuery({ query: countQuery, values }),
    executeQuery({ query: summaryQuery, values }),
    executeQuery({ query: dataQuery, values: dataValues })
  ]);

  const totalRecords = countResult[0]?.total || 0;
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
  const query = `
    SELECT id, type, paid_to, amount, payment_mode, remark, transaction_date, is_deleted, createdAt, updatedAt
    FROM transactions
    WHERE id = ? AND is_deleted = 0
  `;
  const results = await executeQuery({ query, values: [id] });

  if (results.length === 0) {
    throw createError(404, 'Transaction not found');
  }

  return results[0];
};

/**
 * Update transaction by ID
 */
export const updateTransaction = async (id, updatedFields) => {
  // Verify transaction exists
  await getTransactionById(id);

  const allowdFields = ["type", "paid_to", "amount", "payment_mode", "remark", "transaction_date"];
  const keys = Object.keys(updatedFields).filter(key => allowdFields.includes(key) && updatedFields[key] !== undefined);

  if (keys.length === 0) throw createError(400, "No valid fields provided for update.");

  const setClause = keys.map(key => `${key} = ?`).join(", ");

  const values = keys.map(key => updatedFields[key]);
  values.push(id);

  const updateQuery = `
    UPDATE transactions
    SET ${setClause}
    WHERE id = ? AND is_deleted = 0
  `;

  await executeQuery({ query: updateQuery, values });

  return getTransactionById(id);
};

/**
 * Soft delete transaction by ID
 */
export const deleteTransaction = async (id) => {
  // Verify transaction exists
  await getTransactionById(id);

  const query = `
    UPDATE transactions
    SET is_deleted = 1
    WHERE id = ? AND is_deleted = 0
  `;
  await executeQuery({ query, values: [id] });

  return { message: 'Transaction deleted successfully', id: parseInt(id, 10) };
};
