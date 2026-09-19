import mongoose from 'mongoose';

const { Schema } = mongoose;

const transactionSchema = new Schema(
  {
    type: {
      type: Number,
      required: [true, 'Transaction type is required'],
      enum: {
        values: [1, 2],
        message: 'Type must be 1 (Cash In) or 2 (Cash Out)'
      },
      default: 1
    },
    paid_to: {
      type: String,
      trim: true,
      maxlength: [45, 'Paid to / Party name cannot exceed 45 characters'],
      default: null
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [1, 'Amount must be greater than 0']
    },
    payment_mode: {
      type: Number,
      required: [true, 'Payment mode is required'],
      enum: {
        values: [1, 2, 3],
        message: 'Payment mode must be 1 (Cash), 2 (Cheque), or 3 (Online)'
      }
    },
    remark: {
      type: String,
      trim: true,
      maxlength: [200, 'Remark cannot exceed 200 characters'],
      default: null
    },
    transaction_date: {
      type: Date,
      required: [true, 'Transaction date is required']
    },
    is_deleted: {
      type: Number,
      default: 0 // 0 = active, 1 = deleted
    }
  },
  {
    timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        ret.id = ret._id.toString();
        delete ret.__v;
        return ret;
      }
    },
    toObject: {
      virtuals: true,
      transform: (doc, ret) => {
        ret.id = ret._id.toString();
        delete ret.__v;
        return ret;
      }
    }
  }
);

// Indexes for query optimization
transactionSchema.index({ is_deleted: 1, transaction_date: -1, _id: -1 });
transactionSchema.index({ is_deleted: 1, type: 1 });
transactionSchema.index({ is_deleted: 1, payment_mode: 1 });

const Transaction = mongoose.model('Transaction', transactionSchema, 'transactions');

export default Transaction;
