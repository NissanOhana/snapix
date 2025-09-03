// Load and validate environment variables FIRST
import './env';

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import passport from 'passport';
import * as trpcExpress from '@trpc/server/adapters/express';
import path from 'path';

// Import configurations
import connectDB from './config/database';
import './config/passport';

// Import tRPC
import { appRouter } from './trpc/router';
import { createContext } from './trpc/context';

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
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// General middleware
app.use(compression() as any);
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev') as any);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Health check endpoint for deployment platforms
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV 
  });
});

// Session configuration with MongoDB store for persistence
app.use(
  session({
    secret: process.env.SESSION_SECRET!,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGODB_URI!,
      collectionName: 'sessions',
      ttl: 14 * 24 * 60 * 60, // 14 days
      autoRemove: 'native',
      touchAfter: 24 * 3600, // lazy session update
    }),
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 14 * 24 * 60 * 60 * 1000, // 14 days
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
    },
  }) as any
);

// Passport middleware
app.use(passport.initialize() as any);
app.use(passport.session() as any);

// Facebook OAuth routes (still needed for initial auth flow)
// Note: Start with minimal scope - add 'email' later after Facebook app approval
app.get('/api/auth/facebook',
  passport.authenticate('facebook', {
    // Request only minimal, non-reviewed permission in dev
    scope: ['public_profile'],
  })
);

app.get('/api/auth/facebook/callback',
  passport.authenticate('facebook', { 
    session: false,
    failureRedirect: `${process.env.CLIENT_URL}/login?error=auth_failed` 
  }),
  async (req, res) => {
    try {
      console.log('Facebook callback - User object:', req.user);
      const user = req.user as any;
      if (!user) {
        console.error('No user object after Facebook auth');
        return res.redirect(`${process.env.CLIENT_URL}/login?error=auth_failed`);
      }

      // You'll need to import AuthService here
      const authService = (await import('./services/auth.service')).default;
      const { accessToken, refreshToken } = authService.generateTokens(user);
      await authService.saveRefreshToken((user._id as any).toString(), refreshToken);

      // Redirect with tokens
      res.redirect(
        `${process.env.CLIENT_URL}/auth/callback?token=${accessToken}&refresh=${refreshToken}`
      );
    } catch (error) {
      console.error('Auth callback error:', error);
      res.redirect(`${process.env.CLIENT_URL}/login?error=auth_failed`);
    }
  }
);

// tRPC endpoint
app.use('/api/trpc', trpcExpress.createExpressMiddleware({
  router: appRouter,
  createContext: createContext as any,
}) as any);

// API Health check (for external monitoring)
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
  // Multiple possible paths for different deployment structures
  const possibleStaticPaths = [
    path.join(__dirname, '../../../packages/snapix-app/dist'),
    path.join(__dirname, '../../snapix-app/dist'),
    path.join(__dirname, '../snapix-app/dist'),
    path.join(process.cwd(), 'packages/snapix-app/dist'),
    path.join(process.cwd(), 'dist')
  ];

  let staticPath = null;
  const fs = require('fs');
  
  for (const testPath of possibleStaticPaths) {
    if (fs.existsSync(testPath)) {
      staticPath = testPath;
      break;
    }
  }

  if (staticPath) {
    console.log(`📁 Serving static files from: ${staticPath}`);
    app.use(express.static(staticPath));
    
    app.get('*', (req, res) => {
      const indexPath = path.join(staticPath, 'index.html');
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.status(404).send('Static files not found');
      }
    });
  } else {
    console.error('❌ Could not find static files directory');
    app.get('*', (req, res) => {
      res.status(500).send('Static files not configured properly');
    });
  }
}

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
  console.log(`📡 tRPC endpoint: http://localhost:${PORT}/api/trpc`);
  console.log(`🏠 Working directory: ${process.cwd()}`);
  console.log(`📂 __dirname: ${__dirname}`);
  
  // Log available directories for debugging
  const fs = require('fs');
  try {
    const rootFiles = fs.readdirSync(process.cwd());
    console.log(`📁 Root directory contents: ${rootFiles.join(', ')}`);
  } catch (e) {
    console.log('Could not read root directory');
  }
});
