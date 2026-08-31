import { z } from 'zod';

export const registerSchema = z.object({
  body: z.object({
    name: z
      .string({ required_error: 'Name is required' })
      .min(2, 'Name must be at least 2 characters')
      .max(150, 'Name cannot exceed 150 characters'),
    mobile: z
      .string({ required_error: 'Mobile number is required' })
      .regex(/^[0-9]{10}$/, 'Mobile number must be a valid 10-digit number'),
    password: z
      .string({ required_error: 'Password is required' })
      .min(6, 'Password must be at least 6 characters long')
      .max(72, 'Password cannot exceed 72 characters'),
    role: z.number().optional()
  })
});

export const loginSchema = z.object({
  body: z.object({
    mobile: z
      .string({ required_error: 'Mobile number is required' })
      .regex(/^[0-9]{10}$/, 'Mobile number must be a valid 10-digit number'),
    password: z.string({ required_error: 'Password is required' }).min(1, 'Password is required')
  })
});

export const forgotPasswordSchema = z.object({
  body: z
    .object({
      mobile: z
        .string({ required_error: 'Mobile number is required' })
        .regex(/^[0-9]{10}$/, 'Mobile number must be a valid 10-digit number'),
      password: z
        .string({ required_error: 'Password is required' })
        .min(6, 'Password must be at least 6 characters long')
        .max(72, 'Password cannot exceed 72 characters'),
      confirm_password: z
        .string({ required_error: 'Confirm Password is required' })
        .min(6, 'Confirm Password must be at least 6 characters long')
        .max(72, 'Password cannot exceed 72 characters')
    })
    .refine((data) => data.password === data.confirm_password, {
      message: 'Password and Confirm Password do not match',
      path: ['confirm_password']
    })
});

export const updateProfileSchema = z.object({
  body: z.object({
    name: z
      .string()
      .min(2, 'Name must be at least 2 characters')
      .max(150, 'Name cannot exceed 150 characters')
      .optional(),
    mobile: z
      .string()
      .regex(/^[0-9]{10}$/, 'Mobile number must be a valid 10-digit number')
      .optional(),
    password: z
      .string()
      .min(6, 'Password must be at least 6 characters long')
      .max(72, 'Password cannot exceed 72 characters')
      .optional()
  })
});


