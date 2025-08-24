# Full-Stack Application Setup Instructions

## Architecture Overview

```
┌─────────────┐         ┌──────────────────────────┐         ┌─────────────┐
│   Auth      │────────▶│       NODE SERVER        │◀────────│  Frontend   │
│  Service    │         │                          │ renders │ (Vite+React)│
│ (Facebook)  │         │  ┌──────────────────┐   │────────▶│   - SPA     │
└─────────────┘         │  │  Users Routes    │   │         │ - TanStack  │
                        │  └──────────────────┘   │         │   Router    │
┌─────────────┐         │  ┌──────────────────┐   │         │ - Zustand   │
│  Facebook   │◀────────│  │  FB Routes       │   │         │ - React     │
│     API     │         │  └──────────────────┘   │         │   Query     │
└─────────────┘         │  ┌──────────────────┐   │         └─────────────┘
                        │  │  Agents Routes    │   │
┌─────────────┐         │  │  (n8n webhooks)  │   │
│     n8n     │◀────────│  └──────────────────┘   │
│  Workflows  │         │                          │
└─────────────┘         │    MongoDB Atlas DB      │
                        └──────────────────────────┘
```

## Design Recommendations

### Current Architecture Strengths ✅
- Clean separation of concerns with dedicated route modules
- Stateless JWT authentication
- MongoDB for flexible data structure
- Single server serving both API and SPA

### Recommended Improvements 🚀

1. **Add Redis for Session Management**
   - Store JWT refresh tokens
   - Cache Facebook API responses
   - Rate limiting storage

2. **Implement API Gateway Pattern**
   - Add request validation middleware (Zod/Joi)
   - Centralized error handling
   - Request/Response logging

3. **Add Background Job Queue**
   - Use Bull/BullMQ for async tasks
   - Process n8n webhooks asynchronously
   - Handle Facebook API rate limits

4. **Security Enhancements**
   - Implement rate limiting per user/IP
   - Add request signing for n8n webhooks
   - Use refresh token rotation

5. **Monitoring & Observability**
   - Add APM (Sentry/DataDog)
   - Structured logging (Winston/Pino)
   - Health check endpoints

## Project Structure
```
project-root/
├── client/                     # React SPA Frontend
│   ├── src/
│   │   ├── routes/            # TanStack Router routes
│   │   │   ├── __root.tsx
│   │   │   ├── index.tsx
│   │   │   ├── login.tsx
│   │   │   ├── dashboard.tsx
│   │   │   └── auth.callback.tsx
│   │   ├── components/
│   │   ├── hooks/
│   │   │   ├── useAuth.ts
│   │   │   └── useFacebookData.ts
│   │   ├── stores/            # Zustand stores
│   │   │   ├── authStore.ts
│   │   │   └── userStore.ts
│   │   ├── lib/
│   │   │   ├── api.ts
│   │   │   └── queryClient.ts
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── public/
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── .env.local
├── server/                     # Node.js Backend
│   ├── src/
│   │   ├── routes/
│   │   │   ├── users.routes.ts
│   │   │   ├── auth.routes.ts
│   │   │   ├── facebook.routes.ts
│   │   │   └── agents.routes.ts
│   │   ├── controllers/
│   │   │   ├── users.controller.ts
│   │   │   ├── auth.controller.ts
│   │   │   ├── facebook.controller.ts
│   │   │   └── agents.controller.ts
│   │   ├── models/
│   │   │   └── User.ts
│   │   ├── middleware/
│   │   │   ├── auth.middleware.ts
│   │   │   ├── validation.middleware.ts
│   │   │   └── error.middleware.ts
│   │   ├── services/
│   │   │   ├── auth.service.ts
│   │   │   ├── facebook.service.ts
│   │   │   └── n8n.service.ts
│   │   ├── config/
│   │   │   ├── database.ts
│   │   │   └── passport.ts
│   │   ├── types/
│   │   │   └── index.ts
│   │   └── index.ts
│   ├── package.json
│   ├── tsconfig.json
│   └── .env
├── .gitignore
├── package.json
├── README.md
└── render.yaml
```

## Step-by-Step Setup

### Step 1: Initialize Project
```bash
mkdir my-fullstack-app
cd my-fullstack-app
npm init -y

# Create project structure
mkdir -p client/src/{routes,components,hooks,stores,lib}
mkdir -p server/src/{routes,controllers,models,middleware,services,config,types}
```

### Step 2: Setup Server (Backend)

#### 2.1 Initialize Server
```bash
cd server
npm init -y
```

#### 2.2 Install Server Dependencies
```bash
# Core dependencies
npm install express cors helmet morgan compression dotenv
npm install mongoose
npm install passport passport-facebook passport-jwt jsonwebtoken
npm install cookie-parser express-session
npm install axios
npm install express-validator zod

# Dev dependencies
npm install -D typescript @types/node @types/express
npm install -D @types/cors @types/compression @types/morgan
npm install -D @types/passport @types/passport-facebook @types/passport-jwt
npm install -D @types/jsonwebtoken @types/cookie-parser @types/express-session
npm install -D nodemon ts-node tsx
npm install -D @types/mongoose
```

#### 2.3 Create server/tsconfig.json
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "moduleResolution": "node",
    "allowSyntheticDefaultImports": true,
    "declaration": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

#### 2.4 Create server/.env
```env
# Server
NODE_ENV=development
PORT=5000

# MongoDB Atlas
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<dbname>?retryWrites=true&w=majority

# Facebook OAuth
FACEBOOK_APP_ID=your_facebook_app_id
FACEBOOK_APP_SECRET=your_facebook_app_secret
FACEBOOK_CALLBACK_URL=http://localhost:5000/api/auth/facebook/callback

# JWT
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRE=7d
JWT_REFRESH_SECRET=your_refresh_token_secret_change_this
JWT_REFRESH_EXPIRE=30d

# Session
SESSION_SECRET=your_session_secret_change_this_in_production

# Client URL
CLIENT_URL=http://localhost:5173

# n8n Configuration
N8N_WEBHOOK_URL=your_n8n_webhook_url
N8N_API_KEY=your_n8n_api_key

# Facebook Graph API
FACEBOOK_GRAPH_VERSION=v18.0
```

#### 2.5 Create server/src/types/index.ts
```typescript
import { Request } from 'express';
import { IUser } from '../models/User';

export interface AuthRequest extends Request {
  user?: IUser;
}

export interface TokenPayload {
  id: string;
  email: string;
}

export interface FacebookTokens {
  accessToken: string;
  refreshToken?: string;
}
```

#### 2.6 Create server/src/config/database.ts
```typescript
import mongoose from 'mongoose';

const connectDB = async (): Promise<void> => {
  try {
    mongoose.set('strictQuery', true);
    
    const conn = await mongoose.connect(process.env.MONGODB_URI as string, {
      maxPoolSize: 10,
    });
    
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    
    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.warn('MongoDB disconnected');
    });
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    process.exit(1);
  }
};

export default connectDB;
```

#### 2.7 Create server/src/models/User.ts
```typescript
import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  facebookId: string;
  email: string;
  name: string;
  profilePicture?: string;
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
}

const UserSchema: Schema = new Schema(
  {
    facebookId: {
      type: String,
      required: true,
      unique: true,
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
    profilePicture: {
      type: String,
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
        delete ret.facebookTokens;
        delete ret.refreshToken;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Indexes for performance
UserSchema.index({ email: 1, isActive: 1 });
UserSchema.index({ createdAt: -1 });

export default mongoose.model<IUser>('User', UserSchema);
```

#### 2.8 Create server/src/services/auth.service.ts
```typescript
import jwt from 'jsonwebtoken';
import User, { IUser } from '../models/User';
import { TokenPayload } from '../types';

export class AuthService {
  generateTokens(user: IUser) {
    const payload: TokenPayload = {
      id: user._id.toString(),
      email: user.email,
    };

    const accessToken = jwt.sign(payload, process.env.JWT_SECRET!, {
      expiresIn: process.env.JWT_EXPIRE,
    });

    const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET!, {
      expiresIn: process.env.JWT_REFRESH_EXPIRE,
    });

    return { accessToken, refreshToken };
  }

  async verifyRefreshToken(token: string): Promise<IUser | null> {
    try {
      const decoded = jwt.verify(
        token,
        process.env.JWT_REFRESH_SECRET!
      ) as TokenPayload;

      const user = await User.findById(decoded.id).select('+refreshToken');
      
      if (!user || user.refreshToken !== token) {
        return null;
      }

      return user;
    } catch (error) {
      return null;
    }
  }

  async saveRefreshToken(userId: string, refreshToken: string) {
    await User.findByIdAndUpdate(userId, { refreshToken });
  }

  async revokeRefreshToken(userId: string) {
    await User.findByIdAndUpdate(userId, { refreshToken: null });
  }
}

export default new AuthService();
```

#### 2.9 Create server/src/services/facebook.service.ts
```typescript
import axios from 'axios';
import { IUser } from '../models/User';

export class FacebookService {
  private baseURL = `https://graph.facebook.com/${process.env.FACEBOOK_GRAPH_VERSION}`;

  async getUserData(accessToken: string) {
    try {
      const response = await axios.get(`${this.baseURL}/me`, {
        params: {
          fields: 'id,name,email,picture.type(large)',
          access_token: accessToken,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Facebook API Error:', error);
      throw new Error('Failed to fetch Facebook user data');
    }
  }

  async getUserPages(accessToken: string) {
    try {
      const response = await axios.get(`${this.baseURL}/me/accounts`, {
        params: {
          access_token: accessToken,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Facebook Pages API Error:', error);
      throw new Error('Failed to fetch Facebook pages');
    }
  }

  async getPageInsights(pageId: string, accessToken: string) {
    try {
      const response = await axios.get(`${this.baseURL}/${pageId}/insights`, {
        params: {
          access_token: accessToken,
          metric: 'page_impressions,page_engaged_users',
          period: 'day',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Facebook Insights API Error:', error);
      throw new Error('Failed to fetch page insights');
    }
  }
}

export default new FacebookService();
```

#### 2.10 Create server/src/services/n8n.service.ts
```typescript
import axios from 'axios';

export class N8nService {
  async triggerWorkflow(workflowId: string, data: any) {
    try {
      const response = await axios.post(
        process.env.N8N_WEBHOOK_URL!,
        {
          workflowId,
          data,
          timestamp: new Date().toISOString(),
        },
        {
          headers: {
            'X-API-Key': process.env.N8N_API_KEY,
            'Content-Type': 'application/json',
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error('n8n webhook error:', error);
      throw new Error('Failed to trigger n8n workflow');
    }
  }
}

export default new N8nService();
```

#### 2.11 Create server/src/config/passport.ts
```typescript
import passport from 'passport';
import { Strategy as FacebookStrategy } from 'passport-facebook';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import User from '../models/User';
import authService from '../services/auth.service';

// Facebook Strategy
passport.use(
  new FacebookStrategy(
    {
      clientID: process.env.FACEBOOK_APP_ID!,
      clientSecret: process.env.FACEBOOK_APP_SECRET!,
      callbackURL: process.env.FACEBOOK_CALLBACK_URL!,
      profileFields: ['id', 'emails', 'name', 'picture.type(large)'],
      scope: ['email', 'public_profile'],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await User.findOne({ facebookId: profile.id });

        if (user) {
          // Update existing user
          user.facebookTokens = { accessToken, refreshToken };
          user.lastLogin = new Date();
          await user.save();
        } else {
          // Create new user
          user = await User.create({
            facebookId: profile.id,
            email: profile.emails?.[0]?.value || `${profile.id}@facebook.com`,
            name: `${profile.name?.givenName} ${profile.name?.familyName}`,
            profilePicture: profile.photos?.[0]?.value,
            facebookTokens: { accessToken, refreshToken },
            lastLogin: new Date(),
          });
        }

        return done(null, user);
      } catch (error) {
        return done(error as Error, false);
      }
    }
  )
);

// JWT Strategy
passport.use(
  new JwtStrategy(
    {
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SECRET!,
    },
    async (payload, done) => {
      try {
        const user = await User.findById(payload.id);
        if (user && user.isActive) {
          return done(null, user);
        }
        return done(null, false);
      } catch (error) {
        return done(error, false);
      }
    }
  )
);

export default passport;
```

#### 2.12 Create server/src/middleware/auth.middleware.ts
```typescript
import { Response, NextFunction } from 'express';
import passport from 'passport';
import { AuthRequest } from '../types';

export const authenticateJWT = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  passport.authenticate('jwt', { session: false }, (err: any, user: any) => {
    if (err || !user) {
      return res.status(401).json({ 
        success: false,
        message: 'Unauthorized' 
      });
    }
    req.user = user;
    next();
  })(req, res, next);
};
```

#### 2.13 Create server/src/middleware/validation.middleware.ts
```typescript
import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

export const validate = (schema: z.ZodSchema) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          errors: error.errors,
        });
      }
      next(error);
    }
  };
};
```

#### 2.14 Create server/src/middleware/error.middleware.ts
```typescript
import { Request, Response, NextFunction } from 'express';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('Error:', err);

  const status = (err as any).status || 500;
  const message = err.message || 'Internal Server Error';

  res.status(status).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};
```

#### 2.15 Create server/src/controllers/auth.controller.ts
```typescript
import { Request, Response } from 'express';
import { AuthRequest } from '../types';
import authService from '../services/auth.service';

export class AuthController {
  async handleFacebookCallback(req: AuthRequest, res: Response) {
    try {
      const user = req.user;
      if (!user) {
        return res.redirect(`${process.env.CLIENT_URL}/login?error=auth_failed`);
      }

      const { accessToken, refreshToken } = authService.generateTokens(user);
      await authService.saveRefreshToken(user._id.toString(), refreshToken);

      // Redirect with tokens
      res.redirect(
        `${process.env.CLIENT_URL}/auth/callback?token=${accessToken}&refresh=${refreshToken}`
      );
    } catch (error) {
      console.error('Auth callback error:', error);
      res.redirect(`${process.env.CLIENT_URL}/login?error=auth_failed`);
    }
  }

  async getCurrentUser(req: AuthRequest, res: Response) {
    res.json({
      success: true,
      data: req.user,
    });
  }

  async refreshToken(req: Request, res: Response) {
    try {
      const { refreshToken } = req.body;
      
      if (!refreshToken) {
        return res.status(400).json({
          success: false,
          message: 'Refresh token required',
        });
      }

      const user = await authService.verifyRefreshToken(refreshToken);
      
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid refresh token',
        });
      }

      const tokens = authService.generateTokens(user);
      await authService.saveRefreshToken(user._id.toString(), tokens.refreshToken);

      res.json({
        success: true,
        data: tokens,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to refresh token',
      });
    }
  }

  async logout(req: AuthRequest, res: Response) {
    try {
      if (req.user) {
        await authService.revokeRefreshToken(req.user._id.toString());
      }
      res.json({
        success: true,
        message: 'Logged out successfully',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Logout failed',
      });
    }
  }
}

export default new AuthController();
```

#### 2.16 Create server/src/routes/auth.routes.ts
```typescript
import { Router } from 'express';
import passport from 'passport';
import authController from '../controllers/auth.controller';
import { authenticateJWT } from '../middleware/auth.middleware';

const router = Router();

// Facebook OAuth
router.get(
  '/facebook',
  passport.authenticate('facebook', { scope: ['email', 'public_profile'] })
);

router.get(
  '/facebook/callback',
  passport.authenticate('facebook', { session: false }),
  authController.handleFacebookCallback
);

// Token management
router.post('/refresh', authController.refreshToken);
router.get('/me', authenticateJWT, authController.getCurrentUser);
router.post('/logout', authenticateJWT, authController.logout);

export default router;
```

#### 2.17 Create server/src/routes/users.routes.ts
```typescript
import { Router } from 'express';
import { authenticateJWT } from '../middleware/auth.middleware';
import User from '../models/User';
import { AuthRequest } from '../types';

const router = Router();

// Get user profile
router.get('/profile', authenticateJWT, async (req: AuthRequest, res) => {
  try {
    const user = await User.findById(req.user?._id);
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch profile' });
  }
});

// Update user profile
router.patch('/profile', authenticateJWT, async (req: AuthRequest, res) => {
  try {
    const { name, metadata } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user?._id,
      { name, metadata },
      { new: true }
    );
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update profile' });
  }
});

export default router;
```

#### 2.18 Create server/src/routes/facebook.routes.ts
```typescript
import { Router } from 'express';
import { authenticateJWT } from '../middleware/auth.middleware';
import facebookService from '../services/facebook.service';
import { AuthRequest } from '../types';

const router = Router();

router.use(authenticateJWT);

// Get Facebook user data
router.get('/me', async (req: AuthRequest, res) => {
  try {
    const accessToken = req.user?.facebookTokens?.accessToken;
    
    if (!accessToken) {
      return res.status(400).json({
        success: false,
        message: 'No Facebook access token',
      });
    }

    const data = await facebookService.getUserData(accessToken);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch Facebook data',
    });
  }
});

// Get user's Facebook pages
router.get('/pages', async (req: AuthRequest, res) => {
  try {
    const accessToken = req.user?.facebookTokens?.accessToken;
    
    if (!accessToken) {
      return res.status(400).json({
        success: false,
        message: 'No Facebook access token',
      });
    }

    const data = await facebookService.getUserPages(accessToken);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch Facebook pages',
    });
  }
});

// Get page insights
router.get('/pages/:pageId/insights', async (req: AuthRequest, res) => {
  try {
    const { pageId } = req.params;
    const accessToken = req.user?.facebookTokens?.accessToken;
    
    if (!accessToken) {
      return res.status(400).json({
        success: false,
        message: 'No Facebook access token',
      });
    }

    const data = await facebookService.getPageInsights(pageId, accessToken);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch page insights',
    });
  }
});

export default router;
```

#### 2.19 Create server/src/routes/agents.routes.ts
```typescript
import { Router } from 'express';
import { authenticateJWT } from '../middleware/auth.middleware';
import n8nService from '../services/n8n.service';
import { AuthRequest } from '../types';

const router = Router();

router.use(authenticateJWT);

// Trigger n8n workflow
router.post('/trigger', async (req: AuthRequest, res) => {
  try {
    const { workflowId, data } = req.body;
    
    const result = await n8nService.triggerWorkflow(workflowId, {
      ...data,
      userId: req.user?._id,
      userEmail: req.user?.email,
    });
    
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to trigger workflow',
    });
  }
});

export default router;
```

#### 2.20 Create server/src/index.ts
```typescript
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import passport from 'passport';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Import configurations
import connectDB from './config/database';
import './config/passport';

// Import routes
import authRoutes from './routes/auth.routes';
import usersRoutes from './routes/users.routes';
import facebookRoutes from './routes/facebook.routes';
import agentsRoutes from './routes/agents.routes';

// Import middleware
import { errorHandler } from './middleware/error.middleware';

const app = express();

// Connect to MongoDB
connectDB();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false, // Configure properly for production
  crossOriginEmbedderPolicy: false,
}));

// CORS configuration
app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// General middleware
app.use(compression());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Session configuration
app.use(
  session({
    secret: process.env.SESSION_SECRET!,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  })
);

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/facebook', facebookRoutes);
app.use('/api/agents', agentsRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

// Serve React app in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../../client/dist')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../../client/dist/index.html'));
  });
}

// Error handling middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
});
```

#### 2.21 Update server/package.json
```json
{
  "name": "server",
  "version": "1.0.0",
  "main": "dist/index.js",
  "scripts": {
    "dev": "nodemon --exec tsx src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "lint": "eslint . --ext .ts",
    "test": "jest"
  }
}
```

### Step 3: Setup Client (Frontend with TanStack Router & Zustand)

#### 3.1 Create Vite React App
```bash
cd ../client
npm create vite@latest . -- --template react-ts
```

#### 3.2 Install Client Dependencies
```bash
# Core dependencies
npm install @tanstack/react-router @tanstack/router-devtools
npm install @tanstack/react-query @tanstack/react-query-devtools
npm install zustand immer
npm install axios
npm install lucide-react

# Dev dependencies
npm install -D @types/node
```

#### 3.3 Create client/.env.local
```env
VITE_API_URL=http://localhost:5000/api
VITE_APP_URL=http://localhost:5173
```

#### 3.4 Update client/vite.config.ts
```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});
```

#### 3.5 Create client/tsconfig.json
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

#### 3.6 Create client/src/lib/api.ts
```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        const response = await api.post('/auth/refresh', { refreshToken });
        
        const { accessToken, refreshToken: newRefreshToken } = response.data.data;
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', newRefreshToken);
        
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;
```

#### 3.7 Create client/src/lib/queryClient.ts
```typescript
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});
```

#### 3.8 Create client/src/stores/authStore.ts
```typescript
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import api from '@/lib/api';

interface User {
  _id: string;
  email: string;
  name: string;
  profilePicture?: string;
  metadata?: Record<string, any>;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setUser: (user: User | null) => void;
  login: () => void;
  logout: () => Promise<void>;
  fetchUser: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  immer((set) => ({
    user: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,

    setUser: (user) =>
      set((state) => {
        state.user = user;
        state.isAuthenticated = !!user;
      }),

    login: () => {
      window.location.href = `${import.meta.env.VITE_API_URL}/auth/facebook`;
    },

    logout: async () => {
      try {
        await api.post('/auth/logout');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        set((state) => {
          state.user = null;
          state.isAuthenticated = false;
        });
        window.location.href = '/login';
      } catch (error) {
        console.error('Logout error:', error);
      }
    },

    fetchUser: async () => {
      set((state) => {
        state.isLoading = true;
        state.error = null;
      });

      try {
        const token = localStorage.getItem('accessToken');
        if (!token) {
          throw new Error('No token found');
        }

        const response = await api.get('/auth/me');
        set((state) => {
          state.user = response.data.data;
          state.isAuthenticated = true;
          state.isLoading = false;
        });
      } catch (error: any) {
        set((state) => {
          state.user = null;
          state.isAuthenticated = false;
          state.isLoading = false;
          state.error = error.message;
        });
      }
    },

    clearError: () =>
      set((state) => {
        state.error = null;
      }),
  }))
);
```

#### 3.9 Create client/src/stores/userStore.ts
```typescript
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

interface FacebookData {
  pages?: any[];
  insights?: any;
}

interface UserState {
  facebookData: FacebookData;
  setFacebookData: (data: FacebookData) => void;
  clearFacebookData: () => void;
}

export const useUserStore = create<UserState>()(
  immer((set) => ({
    facebookData: {},

    setFacebookData: (data) =>
      set((state) => {
        state.facebookData = { ...state.facebookData, ...data };
      }),

    clearFacebookData: () =>
      set((state) => {
        state.facebookData = {};
      }),
  }))
);
```

#### 3.10 Create client/src/hooks/useAuth.ts
```typescript
import { useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';

export const useAuth = () => {
  const {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    logout,
    fetchUser,
    clearError,
  } = useAuthStore();

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token && !user && !isLoading) {
      fetchUser();
    }
  }, []);

  return {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    logout,
    clearError,
  };
};
```

#### 3.11 Create client/src/hooks/useFacebookData.ts
```typescript
import { useQuery, useMutation } from '@tanstack/react-query';
import api from '@/lib/api';
import { useUserStore } from '@/stores/userStore';

export const useFacebookData = () => {
  const { setFacebookData } = useUserStore();

  const { data: fbUser, isLoading: isLoadingUser } = useQuery({
    queryKey: ['facebook', 'user'],
    queryFn: async () => {
      const response = await api.get('/facebook/me');
      return response.data.data;
    },
  });

  const { data: pages, isLoading: isLoadingPages } = useQuery({
    queryKey: ['facebook', 'pages'],
    queryFn: async () => {
      const response = await api.get('/facebook/pages');
      const pagesData = response.data.data;
      setFacebookData({ pages: pagesData });
      return pagesData;
    },
  });

  const getPageInsights = useMutation({
    mutationFn: async (pageId: string) => {
      const response = await api.get(`/facebook/pages/${pageId}/insights`);
      return response.data.data;
    },
    onSuccess: (data) => {
      setFacebookData({ insights: data });
    },
  });

  return {
    fbUser,
    pages,
    isLoadingUser,
    isLoadingPages,
    getPageInsights,
  };
};
```

#### 3.12 Create TanStack Router setup - client/src/routes/__root.tsx
```typescript
import { createRootRoute, Outlet } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/router-devtools';

export const Route = createRootRoute({
  component: () => (
    <>
      <Outlet />
      {import.meta.env.DEV && <TanStackRouterDevtools />}
    </>
  ),
});
```

#### 3.13 Create client/src/routes/index.tsx
```typescript
import { createFileRoute, Navigate } from '@tanstack/react-router';
import { useAuth } from '@/hooks/useAuth';

export const Route = createFileRoute('/')({
  component: HomePage,
});

function HomePage() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" />;
  }

  return <Navigate to="/login" />;
}
```

#### 3.14 Create client/src/routes/login.tsx
```typescript
import { createFileRoute } from '@tanstack/react-router';
import { useAuth } from '@/hooks/useAuth';

export const Route = createFileRoute('/login')({
  component: LoginPage,
});

function LoginPage() {
  const { login, isAuthenticated } = useAuth();

  if (isAuthenticated) {
    window.location.href = '/dashboard';
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
        </div>
        <button
          onClick={login}
          className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Login with Facebook
        </button>
      </div>
    </div>
  );
}
```

#### 3.15 Create client/src/routes/auth.callback.tsx
```typescript
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';

export const Route = createFileRoute('/auth/callback')({
  component: AuthCallback,
});

function AuthCallback() {
  const navigate = useNavigate();
  const { fetchUser } = useAuthStore();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const accessToken = params.get('token');
    const refreshToken = params.get('refresh');

    if (accessToken && refreshToken) {
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      
      fetchUser().then(() => {
        navigate({ to: '/dashboard' });
      });
    } else {
      navigate({ to: '/login' });
    }
  }, [navigate, fetchUser]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-2xl font-semibold">Authenticating...</h2>
        <p className="mt-2 text-gray-600">Please wait while we log you in.</p>
      </div>
    </div>
  );
}
```

#### 3.16 Create client/src/routes/dashboard.tsx
```typescript
import { createFileRoute, Navigate } from '@tanstack/react-router';
import { useAuth } from '@/hooks/useAuth';
import { useFacebookData } from '@/hooks/useFacebookData';
import { LogOut, User, Facebook } from 'lucide-react';

export const Route = createFileRoute('/dashboard')({
  component: DashboardPage,
});

function DashboardPage() {
  const { user, isAuthenticated, logout } = useAuth();
  const { fbUser, pages, isLoadingPages } = useFacebookData();

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold">Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">{user?.name}</span>
              <button
                onClick={() => logout()}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* User Info Card */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <div className="flex items-center">
                  <User className="h-8 w-8 text-gray-400" />
                  <div className="ml-4">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      User Information
                    </h3>
                    <div className="mt-2 text-sm text-gray-500">
                      <p>Name: {user?.name}</p>
                      <p>Email: {user?.email}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Facebook Data Card */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <div className="flex items-center">
                  <Facebook className="h-8 w-8 text-blue-600" />
                  <div className="ml-4">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Facebook Connection
                    </h3>
                    <div className="mt-2 text-sm text-gray-500">
                      {fbUser ? (
                        <p>Connected as: {fbUser.name}</p>
                      ) : (
                        <p>Loading Facebook data...</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Pages List */}
            {pages && pages.data && (
              <div className="bg-white overflow-hidden shadow rounded-lg md:col-span-2">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                    Your Facebook Pages
                  </h3>
                  {isLoadingPages ? (
                    <p>Loading pages...</p>
                  ) : (
                    <ul className="divide-y divide-gray-200">
                      {pages.data.map((page: any) => (
                        <li key={page.id} className="py-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-900">
                              {page.name}
                            </span>
                            <span className="text-sm text-gray-500">
                              {page.category}
                            </span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
```

#### 3.17 Create client/src/router.ts
```typescript
import { createRouter } from '@tanstack/react-router';
import { routeTree } from './routeTree.gen';

export const router = createRouter({ 
  routeTree,
  defaultPreload: 'intent',
});

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
```

#### 3.18 Create client/src/App.tsx
```typescript
import { RouterProvider } from '@tanstack/react-router';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { router } from './router';
import { queryClient } from './lib/queryClient';

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      {import.meta.env.DEV && <ReactQueryDevtools />}
    </QueryClientProvider>
  );
}

export default App;
```

#### 3.19 Create client/src/main.tsx
```typescript
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

#### 3.20 Update client/package.json
```json
{
  "name": "client",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
    "preview": "vite preview",
    "routes": "tsr generate"
  },
  "dependencies": {
    "@tanstack/react-query": "^5.x.x",
    "@tanstack/react-query-devtools": "^5.x.x",
    "@tanstack/react-router": "^1.x.x",
    "@tanstack/router-devtools": "^1.x.x",
    "axios": "^1.x.x",
    "immer": "^10.x.x",
    "lucide-react": "^0.x.x",
    "react": "^18.x.x",
    "react-dom": "^18.x.x",
    "zustand": "^4.x.x"
  },
  "devDependencies": {
    "@types/node": "^20.x.x",
    "@types/react": "^18.x.x",
    "@types/react-dom": "^18.x.x",
    "@typescript-eslint/eslint-plugin": "^7.x.x",
    "@typescript-eslint/parser": "^7.x.x",
    "@vitejs/plugin-react": "^4.x.x",
    "autoprefixer": "^10.x.x",
    "eslint": "^8.x.x",
    "eslint-plugin-react-hooks": "^4.x.x",
    "eslint-plugin-react-refresh": "^0.x.x",
    "postcss": "^8.x.x",
    "tailwindcss": "^3.x.x",
    "typescript": "^5.x.x",
    "vite": "^5.x.x"
  }
}
```

#### 3.21 Create client/tailwind.config.js
```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

#### 3.22 Create client/postcss.config.js
```javascript
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

#### 3.23 Create client/src/index.css
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

### Step 4: Root Configuration Files

#### 4.1 Create root package.json
```json
{
  "name": "fullstack-app",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "concurrently \"npm run dev:server\" \"npm run dev:client\"",
    "dev:server": "cd server && npm run dev",
    "dev:client": "cd client && npm run routes && npm run dev",
    "build": "npm run build:client && npm run build:server",
    "build:client": "cd client && npm run build",
    "build:server": "cd server && npm run build",
    "start": "cd server && npm start",
    "install:all": "npm install && cd server && npm install && cd ../client && npm install",
    "setup": "npm run install:all && cd client && npm run routes"
  },
  "devDependencies": {
    "concurrently": "^8.2.0"
  }
}
```

#### 4.2 Create .gitignore
```gitignore
# Dependencies
node_modules/
package-lock.json
yarn.lock
pnpm-lock.yaml

# Environment variables
.env
.env.local
.env.production
.env.*.local

# Build outputs
dist/
build/
.vite/

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*
lerna-debug.log*

# Testing
coverage/
.nyc_output/

# TanStack Router
routeTree.gen.ts

# Temporary files
*.tmp
temp/
```

#### 4.3 Create render.yaml for deployment
```yaml
services:
  - type: web
    name: fullstack-app
    runtime: node
    region: oregon
    plan: free
    buildCommand: npm run install:all && npm run build
    startCommand: npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: MONGODB_URI
        sync: false
      - key: FACEBOOK_APP_ID
        sync: false
      - key: FACEBOOK_APP_SECRET
        sync: false
      - key: JWT_SECRET
        generateValue: true
      - key: JWT_REFRESH_SECRET
        generateValue: true
      - key: SESSION_SECRET
        generateValue: true
      - key: CLIENT_URL
        fromService:
          name: fullstack-app
          type: web
          property: hostUrl
      - key: FACEBOOK_CALLBACK_URL
        fromService:
          name: fullstack-app
          type: web
          property: hostUrl
          envVarKey: FACEBOOK_CALLBACK_URL_BASE
```

## Setup Instructions

### Prerequisites
1. Node.js 18+ and npm installed
2. MongoDB Atlas account with connection string
3. Facebook Developer account with app created
4. n8n instance with webhook URL (optional)

### Initial Setup
```bash
# 1. Clone/create project and navigate to it
cd my-fullstack-app

# 2. Run the setup script
npm run setup

# 3. Configure environment variables
# - Update server/.env with your MongoDB URI
# - Add Facebook App credentials
# - Set secure JWT secrets

# 4. Generate TanStack Router routes
cd client
npm run routes
cd ..

# 5. Start development servers
npm run dev
```

### Facebook App Configuration
1. Go to Facebook Developers Console
2. Add "Facebook Login" product
3. Set Valid OAuth Redirect URIs:
   - Development: `http://localhost:5000/api/auth/facebook/callback`
   - Production: `https://your-app.onrender.com/api/auth/facebook/callback`
4. Add required permissions: email, public_profile, pages_read_engagement

### MongoDB Atlas Setup
1. Create a cluster in MongoDB Atlas
2. Create database user with read/write permissions
3. Whitelist IP addresses (0.0.0.0/0 for development)
4. Get connection string and update MONGODB_URI

### Testing the Application
1. Navigate to http://localhost:5173
2. Click "Login with Facebook"
3. Authorize the app
4. Verify redirect to dashboard
5. Check user creation in MongoDB
6. Test API endpoints with authenticated requests

### Deployment to Render
1. Push code to GitHub repository
2. Connect GitHub repo to Render
3. Use the render.yaml configuration
4. Set environment variables in Render dashboard:
   - MONGODB_URI
   - FACEBOOK_APP_ID
   - FACEBOOK_APP_SECRET
   - N8N_WEBHOOK_URL (if using)
5. Deploy and update Facebook OAuth redirect URL

## Security Checklist
- [ ] Strong, unique JWT secrets
- [ ] Session secret configured
- [ ] MongoDB connection uses SSL/TLS
- [ ] CORS configured for production domain
- [ ] Helmet.js security headers enabled
- [ ] Input validation on all endpoints
- [ ] Rate limiting implemented
- [ ] HTTPS enforced in production
- [ ] Facebook OAuth properly scoped
- [ ] Refresh token rotation enabled
- [ ] Environment variables secured

## Architecture Benefits

### Current Design Strengths
- **SPA with API Backend**: Clean separation, easy to scale
- **TanStack Router**: Type-safe routing, code splitting
- **Zustand**: Lightweight state management, easy to use
- **React Query**: Powerful data fetching, caching
- **JWT with Refresh**: Secure, stateless authentication
- **Modular Route Structure**: Easy to maintain and extend

### Production Recommendations
1. Add Redis for caching and sessions
2. Implement rate limiting (express-rate-limit)
3. Add monitoring (Sentry, DataDog)
4. Use PM2 for process management
5. Implement CI/CD pipeline
6. Add comprehensive testing
7. Use CDN for static assets
8. Implement request signing for webhooks

## Next Development Steps
1. Add comprehensive error boundaries
2. Implement progressive enhancement
3. Add service worker for offline support
4. Implement real-time updates (WebSockets/SSE)
5. Add data validation schemas (Zod)
6. Create admin dashboard
7. Add analytics integration
8. Implement A/B testing framework