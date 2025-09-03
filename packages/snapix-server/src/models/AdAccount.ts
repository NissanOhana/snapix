import mongoose, { Document, Schema } from 'mongoose';

export interface IAdAccount extends Document {
  account_id: string;
  account_name: string;
  access_token?: string;
  currency: string;
  status: 'connected' | 'disconnected' | 'token_expired' | 'temp';
  created_by: string; // User email
  created_by_email?: string; // Alternative field for compatibility
  owner_email?: string; // Alternative field for compatibility
  last_sync?: Date;
  last_error?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const AdAccountSchema: Schema = new Schema(
  {
    account_id: {
      type: String,
      required: true,
      index: true,
    },
    account_name: {
      type: String,
      required: true,
      trim: true,
    },
    access_token: {
      type: String,
      select: false, // Don't include in queries by default for security
    },
    currency: {
      type: String,
      required: true,
      default: 'USD',
    },
    status: {
      type: String,
      enum: ['connected', 'disconnected', 'token_expired', 'temp'],
      default: 'connected',
      index: true,
    },
    created_by: {
      type: String,
      required: true,
      index: true,
    },
    created_by_email: {
      type: String,
      index: true,
    },
    owner_email: {
      type: String,
      index: true,
    },
    last_sync: {
      type: Date,
    },
    last_error: {
      type: String,
    },
    metadata: {
      type: Map,
      of: Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_, ret) => {
        delete (ret as any).access_token;
        delete (ret as any).__v;
        return ret;
      },
    },
  }
);

// Compound indexes for better query performance
AdAccountSchema.index({ created_by: 1, status: 1 });
AdAccountSchema.index({ created_by_email: 1, status: 1 });
AdAccountSchema.index({ owner_email: 1, status: 1 });
AdAccountSchema.index({ account_id: 1, status: 1 });

export default mongoose.model<IAdAccount>('AdAccount', AdAccountSchema);