import mongoose from 'mongoose';

const { Schema } = mongoose;

const sessionSchema = new Schema(
  {
    user_id: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    access_token: {
      type: String,
      required: true,
      index: true
    },
    refresh_token: {
      type: String,
      required: true,
      index: true
    },
    ip: {
      type: String,
      default: '127.0.0.1'
    },
    user_agent: {
      type: String,
      default: null
    }
  },
  {
    timestamps: true,
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

// Auto-expire sessions after 8 days (matches JWT_REFRESH_EXPIRES_IN)
sessionSchema.index({ createdAt: 1 }, { expireAfterSeconds: 8 * 24 * 60 * 60 });

const Session = mongoose.model('Session', sessionSchema, 'sessions');

export default Session;
