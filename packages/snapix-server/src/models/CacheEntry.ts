import mongoose, { Document, Schema } from 'mongoose';

export interface ICacheEntry extends Document {
  key: string;
  value: string;
  expires_at: Date;
  user_email: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const CacheEntrySchema: Schema = new Schema(
  {
    key: {
      type: String,
      required: true,
      index: true,
    },
    value: {
      type: String,
      required: true,
    },
    expires_at: {
      type: Date,
      required: true,
      index: true,
    },
    user_email: {
      type: String,
      required: true,
      index: true,
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
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Compound indexes for better query performance
CacheEntrySchema.index({ key: 1, user_email: 1 }, { unique: true });
CacheEntrySchema.index({ expires_at: 1 }); // For TTL cleanup

// Automatic TTL - MongoDB will auto-delete expired documents
CacheEntrySchema.index({ expires_at: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model<ICacheEntry>('CacheEntry', CacheEntrySchema);