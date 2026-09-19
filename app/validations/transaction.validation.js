import { z } from 'zod';

export const createTransactionSchema = z.object({
  body: z.object({
    type: z
      .number({ invalid_type_error: 'Type must be a number (1 for Cash In, 2 for Cash Out)' })
      .int('Type must be an integer')
      .refine((val) => [1, 2].includes(val), { message: 'Type must be 1 (Cash In) or 2 (Cash Out)' })
      .optional()
      .default(1),
    paid_to: z
      .string()
      .max(45, 'Paid to / Party name cannot exceed 45 characters')
      .nullable()
      .optional(),
    amount: z
      .number({ required_error: 'Amount is required', invalid_type_error: 'Amount must be a number' })
      .int('Amount must be an integer')
      .positive('Amount must be greater than 0'),
    payment_mode: z
      .number({ required_error: 'Payment mode is required', invalid_type_error: 'Payment mode must be a number' })
      .int('Payment mode must be an integer')
      .refine((val) => [1, 2, 3].includes(val), {
        message: 'Payment mode must be 1 (Cash), 2 (Cheque), or 3 (Online)'
      }),
    remark: z
      .string()
      .max(200, 'Remark cannot exceed 200 characters')
      .nullable()
      .optional(),
    transaction_date: z
      .string({ required_error: 'Transaction date is required' })
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Transaction date must be in YYYY-MM-DD format')
  })
});

export const updateTransactionSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[a-fA-F0-9]{24}$/, 'ID must be a valid 24-character hexadecimal ObjectId')
  }),
  body: z
    .object({
      type: z
        .number({ invalid_type_error: 'Type must be a number (1 for Cash In, 2 for Cash Out)' })
        .int('Type must be an integer')
        .refine((val) => [1, 2].includes(val), { message: 'Type must be 1 (Cash In) or 2 (Cash Out)' })
        .optional(),
      paid_to: z
        .string()
        .max(45, 'Paid to / Party name cannot exceed 45 characters')
        .nullable()
        .optional(),
      amount: z
        .number({ invalid_type_error: 'Amount must be a number' })
        .int('Amount must be an integer')
        .positive('Amount must be greater than 0')
        .optional(),
      payment_mode: z
        .number({ invalid_type_error: 'Payment mode must be a number' })
        .int('Payment mode must be an integer')
        .refine((val) => [1, 2, 3].includes(val), {
          message: 'Payment mode must be 1 (Cash), 2 (Cheque), or 3 (Online)'
        })
        .optional(),
      remark: z
        .string()
        .max(200, 'Remark cannot exceed 200 characters')
        .nullable()
        .optional(),
      transaction_date: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, 'Transaction date must be in YYYY-MM-DD format')
        .optional()
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: 'At least one field must be provided for update'
    })
});

export const transactionIdParamSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[a-fA-F0-9]{24}$/, 'ID must be a valid 24-character hexadecimal ObjectId')
  })
});
