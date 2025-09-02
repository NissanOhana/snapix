# 🚀 Snapix - Facebook Integration & Automation Platform

A full-stack application for Facebook integration and automation workflows with guest access functionality.

## ✨ Features

- **🔐 Dual Authentication**: Facebook OAuth + Guest Login
- **📱 Responsive Design**: Mobile-first React frontend
- **🔄 Real-time Updates**: tRPC for type-safe API communication
- **🗄️ MongoDB Integration**: Scalable data storage
- **🎯 Guest Access**: Try the app without Facebook login
- **🔒 Production Ready**: Security headers, CORS, rate limiting
- **☁️ Deploy Ready**: Configured for Render.com deployment

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and Yarn
- MongoDB Atlas account
- Facebook Developer account

### Development Setup

1. **Clone & Install**
   ```bash
   git clone https://github.com/NissanOhana/snapix.git
   cd snapix
   yarn install
   ```

2. **Environment Configuration**
   ```bash
   # Copy environment template
   cp packages/snapix-server/.env.example packages/snapix-server/.env
   
   # Edit with your values
   nano packages/snapix-server/.env
   ```

3. **Start Development**
   ```bash
   yarn dev
   ```
   - Frontend: http://localhost:5173
   - Backend: http://localhost:5001

## 🔐 Authentication

### Facebook OAuth
- Full Facebook integration features
- Access to user profile and pages
- Facebook Pages insights and management

### Guest Login
- Quick access without Facebook account
- Limited feature set (perfect for demos)
- Local session management

## 🌐 Deployment

### Ready to Deploy to Render.com

Your app is **production-ready** with:

✅ **Complete CI/CD Pipeline**
✅ **Environment Variable Management** 
✅ **Health Check Endpoints**
✅ **Static File Serving**
✅ **Security Configurations**
✅ **MongoDB Atlas Integration**

**Next Steps:**
1. **Follow `DEPLOYMENT_GUIDE.md`** for step-by-step instructions
2. **Configure environment variables** in Render dashboard
3. **Update Facebook app settings** with production URLs
4. **Deploy and test!**

### Build Commands
```bash
yarn build    # Production build
yarn start    # Start production server
```

## 📚 Documentation

- **`DEPLOYMENT_GUIDE.md`**: Complete Render.com deployment guide
- **`PRODUCTION_CHECKLIST.md`**: Pre-production requirements
- **`CLAUDE.md`**: Development guidelines and architecture
- **`packages/snapix-server/.env.example`**: Environment variables

## 🛠️ Tech Stack

**Frontend:** React 18, TypeScript, Vite, TanStack Router, Zustand, Tailwind CSS
**Backend:** Node.js, Express, tRPC, MongoDB, Passport.js, JWT
**DevOps:** Yarn Workspaces, Render.com, MongoDB Atlas

---

**🎯 Ready to deploy?** Follow `DEPLOYMENT_GUIDE.md` for complete instructions!