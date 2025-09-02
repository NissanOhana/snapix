# 🚀 Snapix Production Deployment Checklist

## 📋 Pre-Production Requirements

### 1. Facebook App Configuration
- [ ] **Request Advanced Access** for `public_profile` permission
- [ ] **Request Standard/Advanced Access** for `email` permission
- [ ] **Add Privacy Policy URL** (required for production apps)
- [ ] **Add Terms of Service URL** (recommended)
- [ ] **Submit App for Review** if using additional permissions
- [ ] **Update App Category** to appropriate business category
- [ ] **Add App Icon** (1024x1024px)
- [ ] **Complete App Store Presence** section
- [ ] **Verify Business** (if using advanced features)

### 2. Environment Configuration
- [ ] **Generate Production JWT Secrets** (replace development secrets)
- [ ] **Update Facebook OAuth Callback URLs** to production domain
- [ ] **Configure Production MongoDB Atlas** (separate from dev)
- [ ] **Set up Environment Variables** on production server
- [ ] **Configure Production Domains** in Facebook App settings
- [ ] **Enable HTTPS** for production (required for Facebook OAuth)

### 3. Security & Performance
- [ ] **Enable Rate Limiting** on API endpoints
- [ ] **Configure CORS** for production domain only
- [ ] **Set up SSL/TLS certificates**
- [ ] **Enable Helmet.js** security headers in production
- [ ] **Configure Content Security Policy (CSP)**
- [ ] **Set up Database Connection Pooling**
- [ ] **Enable Request Logging** and Monitoring
- [ ] **Configure Error Tracking** (e.g., Sentry)

### 4. Code Quality & Testing
- [ ] **Run Full Test Suite** (unit + integration tests)
- [ ] **Perform Security Audit** (`npm audit`)
- [ ] **Code Review** all authentication flows
- [ ] **Test Facebook Login Flow** end-to-end
- [ ] **Test tRPC API Endpoints** with production data
- [ ] **Performance Testing** under load
- [ ] **Mobile Responsiveness Testing**

### 5. Infrastructure & Deployment
- [ ] **Set up Production Database Backups**
- [ ] **Configure Health Check Endpoints**
- [ ] **Set up Application Monitoring**
- [ ] **Configure Log Aggregation**
- [ ] **Set up CI/CD Pipeline**
- [ ] **Configure Production Build Process**
- [ ] **Set up CDN** for static assets (optional)
- [ ] **Configure Auto-scaling** (if needed)

### 6. Legal & Compliance
- [ ] **Create Privacy Policy** (required for Facebook apps)
- [ ] **Create Terms of Service**
- [ ] **GDPR Compliance** (if serving EU users)
- [ ] **Data Processing Agreements** (if applicable)
- [ ] **Cookie Policy** (if using tracking cookies)

### 7. User Experience
- [ ] **Error Handling** for all authentication failures
- [ ] **Loading States** for all async operations
- [ ] **Offline Support** (optional, but recommended)
- [ ] **User Onboarding Flow**
- [ ] **Help Documentation**

### 8. Facebook App Review Process
- [ ] **Prepare App Review Submission**
  - Detailed description of app functionality
  - Screenshots of login flow
  - Explanation of why permissions are needed
  - Privacy policy link
  - Terms of service link
- [ ] **Submit for Review** (allow 1-7 business days)
- [ ] **Address Review Feedback** (if any)
- [ ] **Go Live** after approval

## 🔧 Current Development Status

### ✅ Completed
- [x] Monorepo setup with tRPC
- [x] Facebook OAuth integration (development mode)
- [x] MongoDB Atlas connection
- [x] Basic authentication flow
- [x] React frontend with TanStack Router
- [x] Environment configuration
- [x] Standard access to `public_profile`

### 🚧 In Progress
- [ ] Facebook login testing (Option A: profile-only)

### ⏳ Pending
- [ ] Email permission configuration
- [ ] Error handling improvements
- [ ] Production environment setup
- [ ] Facebook App Review submission

## 📝 Deployment Commands

### Development
```bash
yarn dev
```

### Production Build
```bash
yarn build
yarn start
```

### Environment Setup
```bash
# Update production environment variables
cp packages/snapix-server/.env.example packages/snapix-server/.env.production
# Edit .env.production with production values
```

## 🔗 Important Links
- Facebook Developer Console: https://developers.facebook.com/apps/1592363432115240
- MongoDB Atlas: [Your cluster URL]
- Render.com Dashboard: [Your deployment URL]
- Domain Management: [Your domain provider]

---
**Note:** This checklist should be completed before making the app available to real users. Each item represents a critical step for production readiness.