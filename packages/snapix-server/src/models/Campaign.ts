import mongoose, { Document, Schema } from 'mongoose';

export interface IPerformanceMetrics {
  spend: number;
  impressions: number;
  clicks: number;
  conversions: number;
  conversion_value: number;
  reach: number;
  frequency: number;
  ctr: number;
  cpc: number;
  cpm: number;
  roas: number;
  cpa: number;
}

export interface ICampaign extends Document {
  meta_campaign_id: string;
  name: string;
  status: string;
  effective_status?: string;
  objective?: string;
  budget: number;
  budget_type: 'daily' | 'lifetime' | 'none';
  created_date?: Date;
  updated_date?: Date;
  start_date?: Date;
  end_date?: Date;
  platform: string;
  is_active: boolean;
  performance_metrics: IPerformanceMetrics;
  created_by: string; // User email
  ad_account_id: string;
  createdAt: Date;
  updatedAt: Date;
}

const PerformanceMetricsSchema = new Schema({
  spend: { type: Number, default: 0 },
  impressions: { type: Number, default: 0 },
  clicks: { type: Number, default: 0 },
  conversions: { type: Number, default: 0 },
  conversion_value: { type: Number, default: 0 },
  reach: { type: Number, default: 0 },
  frequency: { type: Number, default: 0 },
  ctr: { type: Number, default: 0 },
  cpc: { type: Number, default: 0 },
  cpm: { type: Number, default: 0 },
  roas: { type: Number, default: 0 },
  cpa: { type: Number, default: 0 },
}, { _id: false });

const CampaignSchema: Schema = new Schema(
  {
    meta_campaign_id: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      required: true,
      lowercase: true,
      index: true,
    },
    effective_status: {
      type: String,
    },
    objective: {
      type: String,
    },
    budget: {
      type: Number,
      default: 0,
    },
    budget_type: {
      type: String,
      enum: ['daily', 'lifetime', 'none'],
      default: 'none',
    },
    created_date: {
      type: Date,
    },
    updated_date: {
      type: Date,
    },
    start_date: {
      type: Date,
    },
    end_date: {
      type: Date,
    },
    platform: {
      type: String,
      default: 'facebook',
    },
    is_active: {
      type: Boolean,
      default: false,
      index: true,
    },
    performance_metrics: {
      type: PerformanceMetricsSchema,
      default: () => ({}),
    },
    created_by: {
      type: String,
      required: true,
      index: true,
    },
    ad_account_id: {
      type: String,
      required: true,
      index: true,
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
CampaignSchema.index({ created_by: 1, status: 1 });
CampaignSchema.index({ ad_account_id: 1, status: 1 });
CampaignSchema.index({ created_by: 1, is_active: 1 });
CampaignSchema.index({ meta_campaign_id: 1, created_by: 1 });

export default mongoose.model<ICampaign>('Campaign', CampaignSchema);