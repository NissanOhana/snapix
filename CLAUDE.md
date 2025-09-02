# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Snapix is a full-stack application for Facebook integration and automation workflows. It uses a monorepo structure with Yarn workspaces, featuring a React/Vite frontend with TanStack Router and a Node.js/Express backend with tRPC and MongoDB.

## Essential Commands

### Development
```bash
# Start both frontend and backend dev servers
yarn dev

# Start frontend only (port 5173)
yarn workspace snapix-app dev

# Start backend only (port 5000)
yarn workspace snapix-server dev
```

### Build & Production
```bash
# Build both frontend and backend
yarn build

# Start production server
yarn start

# Type check both packages
yarn workspace snapix-app type-check
yarn workspace snapix-server type-check

# Lint both packages
yarn workspace snapix-app lint
yarn workspace snapix-server lint
```

### Package Management
**CRITICAL: Always use Yarn, never npm**
```bash
# Install all dependencies
yarn install

# Add dependencies to specific workspace
yarn workspace snapix-app add <package>
yarn workspace snapix-server add <package>

# Add dev dependencies
yarn workspace snapix-app add -D <package>
yarn workspace snapix-server add -D <package>
```

## Architecture & Key Patterns

### Monorepo Structure
- **Root**: Yarn workspaces configuration, shared scripts
- **packages/snapix-app**: React frontend with Vite, TanStack Router, Zustand, React Query
- **packages/snapix-server**: Express backend with tRPC, MongoDB, Passport.js authentication

### Authentication Flow

#### Facebook OAuth
1. User initiates OAuth via `/api/auth/facebook`
2. Facebook redirects to `/api/auth/facebook/callback`
3. Server generates JWT tokens (access + refresh)
4. Client redirects to `/auth/callback` with tokens
5. Tokens stored in localStorage, used for authenticated API calls
6. tRPC procedures use JWT validation middleware

#### Guest Login
1. User clicks "Continue as Guest" on login page
2. Client generates local guest user with unique ID
3. Guest session stored in localStorage (no server interaction)
4. Guest users have limited access to features
5. No Facebook integration available for guest users
6. Guest session persists until logout or browser data cleared

### API Architecture
- **tRPC**: Type-safe API layer at `/api/trpc`
- **REST endpoints**: OAuth callbacks at `/api/auth/*`
- **Static serving**: Production serves built React app from server

### Data Flow
1. Client components use tRPC hooks from `src/lib/trpc.ts`
2. Requests include JWT in Authorization header
3. Server validates JWT via Passport middleware
4. Routers delegate to services for business logic
5. Services interact with MongoDB models and external APIs

## Key Technologies & Patterns

### Frontend (packages/snapix-app)
- **Routing**: TanStack Router with file-based routes in `src/routes/`
- **State**: Zustand stores in `src/stores/` with Immer for immutability
- **Data Fetching**: React Query via tRPC hooks
- **Styling**: Tailwind CSS with PostCSS
- **Build**: Vite with TypeScript

### Backend (packages/snapix-server)
- **API Layer**: tRPC routers in `src/trpc/routers/`
- **Services**: Business logic in `src/services/` (Facebook, n8n, auth)
- **Models**: Mongoose schemas in `src/models/`
- **Auth**: Passport strategies in `src/config/passport.ts`
- **Environment**: Validated via Zod in `src/env.ts`

## Environment Configuration

Required server environment variables (in `packages/snapix-server/.env`):
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb+srv://...
FACEBOOK_APP_ID=...
FACEBOOK_APP_SECRET=...
JWT_SECRET=...
JWT_REFRESH_SECRET=...
SESSION_SECRET=...
CLIENT_URL=http://localhost:5173
N8N_WEBHOOK_URL=...
```

## Development Guidelines

### Adding New Features

**New tRPC Router:**
1. Create router file in `packages/snapix-server/src/trpc/routers/[name].router.ts`
2. Register in `packages/snapix-server/src/trpc/router.ts`
3. Add service logic in `packages/snapix-server/src/services/[name].service.ts`
4. Use protected procedures for authenticated endpoints

**New Frontend Route:**
1. Create route file in `packages/snapix-app/src/routes/[name].tsx`
2. Use `createFileRoute` from TanStack Router
3. Access tRPC via `trpc.useQuery()` or `trpc.useMutation()`
4. Handle auth with `useAuth()` hook

**New Database Model:**
1. Create schema in `packages/snapix-server/src/models/[Name].ts`
2. Use TypeScript interfaces for type safety
3. Add indexes for query performance
4. Include timestamps and soft delete patterns

### Code Standards
- Use TypeScript strict mode
- 2-space indentation, semicolons required
- Named exports preferred
- React components in PascalCase
- Hooks prefixed with `use`
- Services/routers in camelCase with descriptive suffixes

### Testing & Validation
- Type check before commits: `yarn workspace [package] type-check`
- Fix linting issues: `yarn workspace [package] lint`
- Test authentication flows end-to-end
- Verify tRPC type safety across client/server boundary

## Current Implementation Status

### Completed
- ✅ Monorepo setup with Yarn workspaces
- ✅ tRPC integration with type safety
- ✅ Facebook OAuth authentication
- ✅ Guest login functionality (client-side only)
- ✅ JWT token management with refresh
- ✅ MongoDB models for users
- ✅ React frontend with TanStack Router
- ✅ Zustand state management
- ✅ Development environment configuration

### In Progress
- 🚧 Facebook API integration (pages, insights)
- 🚧 n8n webhook integration for automation
- 🚧 Error handling and recovery flows

### Planned
- ⏳ Production deployment configuration
- ⏳ Rate limiting and security hardening
- ⏳ Comprehensive test coverage
- ⏳ Performance optimization and caching

## Security Considerations
- JWT secrets must be strong and unique in production
- Facebook tokens stored securely in database
- CORS configured for specific origins only
- Helmet.js for security headers
- Input validation via Zod schemas
- MongoDB connection uses SSL/TLS

## Deployment Notes
- Build creates optimized bundles in `dist/` directories
- Server serves both API and static React app in production
- Environment variables must be set on deployment platform
- Facebook OAuth redirect URLs must match production domain
- MongoDB Atlas whitelist must include production IPs