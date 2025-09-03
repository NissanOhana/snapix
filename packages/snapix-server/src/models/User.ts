import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  username: string;
  email: string;
  name: string;
  password: string;
  profilePicture?: string;
  facebookId?: string;
  facebookTokens?: {
    accessToken?: string;
    refreshToken?: string;
  };
  refreshToken?: string;
  lastLogin?: Date;
  isActive: boolean;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema: Schema = new Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      minlength: 3,
      maxlength: 30,
      index: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      select: false,
      minlength: 6,
    },
    profilePicture: {
      type: String,
    },
    facebookId: {
      type: String,
      sparse: true,
      unique: true,
      index: true,
    },
    facebookTokens: {
      accessToken: String,
      refreshToken: String,
    },
    refreshToken: {
      type: String,
      select: false,
    },
    lastLogin: {
      type: Date,
      default: Date.now,
    },
    isActive: {
      type: Boolean,
      default: true,
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
        delete (ret as any).password;
        delete (ret as any).facebookTokens;
        delete (ret as any).refreshToken;
        delete (ret as any).__v;
        return ret;
      },
    },
  }
);

// Indexes for performance
UserSchema.index({ email: 1, isActive: 1 });
UserSchema.index({ username: 1, isActive: 1 });
UserSchema.index({ createdAt: -1 });

// Hash password before saving
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password as string, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Compare password method
UserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    return false;
  }
};

export default mongoose.model<IUser>('User', UserSchema);