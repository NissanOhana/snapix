import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file in the package directory
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Export env vars for validation
export const requiredEnvVars = {
  FACEBOOK_APP_ID: process.env.FACEBOOK_APP_ID,
  FACEBOOK_APP_SECRET: process.env.FACEBOOK_APP_SECRET,
  MONGODB_URI: process.env.MONGODB_URI,
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
  SESSION_SECRET: process.env.SESSION_SECRET,
};

// Optional but recommended environment variables
export const optionalEnvVars = {
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  N8N_WEBHOOK_URL: process.env.N8N_WEBHOOK_URL,
  N8N_API_KEY: process.env.N8N_API_KEY,
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
  FACEBOOK_GRAPH_VERSION: process.env.FACEBOOK_GRAPH_VERSION || 'v19.0',
};

// Validate required environment variables
const missingVars = Object.entries(requiredEnvVars)
  .filter(([key, value]) => !value)
  .map(([key]) => key);

if (missingVars.length > 0) {
  throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
}

console.log('✅ Environment variables loaded successfully');
console.log('🔑 Facebook App ID:', process.env.FACEBOOK_APP_ID);
console.log('📦 MongoDB:', process.env.MONGODB_URI ? 'Connected' : 'Not configured');