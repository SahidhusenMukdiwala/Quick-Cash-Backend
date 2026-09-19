import mongoose from 'mongoose';

const { Schema } = mongoose;

const userSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [150, 'Name cannot exceed 150 characters']
    },
    mobile: {
      type: String,
      required: [true, 'Mobile number is required'],
      unique: true,
      trim: true,
      match: [/^[0-9]{10}$/, 'Mobile number must be a valid 10-digit number']
    },
    password: {
      type: String,
      required: [true, 'Password is required']
    },
    role: {
      type: Number,
      default: 1
    },
    status: {
      type: Number,
      default: 1 // 1 = active, 0 = inactive
    },
    is_delete: {
      type: Number,
      default: 0 // 0 = active, 1 = deleted
    }
  },
  {
    timestamps: { createdAt: 'createdAt', updatedAt: 'modifiedAt' },
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

// Compound index for login/lookup performance
userSchema.index({ mobile: 1, is_delete: 1 });

const User = mongoose.model('User', userSchema, 'users');

export default User;
