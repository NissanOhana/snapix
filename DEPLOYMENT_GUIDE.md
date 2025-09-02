# 🚀 Snapix Deployment Guide for Render.com

This guide will walk you through deploying your Snapix application to Render.com with a complete CI/CD pipeline.

## 📋 Prerequisites

Before you begin, ensure you have:

- [x] **GitHub Account** with your Snapix repository
- [ ] **Render.com Account** (free tier available)
- [ ] **MongoDB Atlas Account** (free tier available)
- [ ] **Facebook Developer Account** with app configured
- [ ] **Domain Name** (optional - you can use Render's subdomain)

## 🔧 Step 1: Environment Variables Preparation

### Required Environment Variables

You'll need to gather these values before deployment:

1. **MongoDB Atlas Connection String**
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/snapix?retryWrites=true&w=majority
   ```

2. **Facebook App Credentials** (from Facebook Developer Console)
   ```
   FACEBOOK_APP_ID=your_facebook_app_id
   FACEBOOK_APP_SECRET=your_facebook_app_secret
   ```

3. **JWT Secrets** (generate strong random strings)
   ```bash
   # Generate secrets locally:
   node -e "console.log('JWT_SECRET=' + require('crypto').randomBytes(64).toString('hex'))"
   node -e "console.log('JWT_REFRESH_SECRET=' + require('crypto').randomBytes(64).toString('hex'))"
   node -e "console.log('SESSION_SECRET=' + require('crypto').randomBytes(64).toString('hex'))"
   ```

4. **Optional: n8n Integration**
   ```
   N8N_WEBHOOK_URL=https://your-n8n-instance.com/webhook/snapix
   ```

## 🗄️ Step 2: MongoDB Atlas Setup

1. **Create MongoDB Atlas Account**
   - Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
   - Sign up for free account

2. **Create a New Cluster**
   - Choose "Build a Database" → "Free" tier
   - Select cloud provider (AWS recommended)
   - Choose region closest to your users

3. **Configure Database Access**
   - Go to "Database Access" in left sidebar
   - Click "Add New Database User"
   - Create username/password for your app
   - Grant "Read and write to any database" role

4. **Configure Network Access**
   - Go to "Network Access" in left sidebar
   - Click "Add IP Address"
   - Click "Allow Access from Anywhere" (0.0.0.0/0)
   - Confirm (this allows Render.com to connect)

5. **Get Connection String**
   - Go to "Database" in left sidebar
   - Click "Connect" on your cluster
   - Choose "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your database user password
   - Replace `myFirstDatabase` with `snapix`

## 📘 Step 3: Facebook App Configuration

### Current Facebook App Setup

1. **Go to Facebook Developer Console**
   - Visit [Facebook Developers](https://developers.facebook.com/apps/)
   - Select your Snapix app

2. **Update App Settings for Production**
   - Go to "App Settings" → "Basic"
   - Add **App Icon** (1024x1024px)
   - Add **Privacy Policy URL** (required for production)
   - Add **Terms of Service URL** (recommended)
   - Set **App Category** to appropriate business category

3. **Configure OAuth Settings**
   - Go to "Products" → "Facebook Login" → "Settings"
   - Add Valid OAuth Redirect URIs:
     ```
     https://your-app-name.onrender.com/api/auth/facebook/callback
     ```
   - Add Valid Deauthorize Callback URL:
     ```
     https://your-app-name.onrender.com/api/auth/facebook/deauth
     ```

4. **App Domains Configuration**
   - In "App Settings" → "Basic"
   - Add to "App Domains":
     ```
     your-app-name.onrender.com
     ```

### Facebook App Review (Optional)
- For `public_profile`: No review needed (approved by default)
- For `email` permission: Submit for review if needed
- For production apps serving real users: Complete app review process

## 🚀 Step 4: Deploy to Render.com

### Option A: Using Render Dashboard (Recommended)

1. **Connect Repository**
   - Go to [Render.com Dashboard](https://dashboard.render.com)
   - Click "New +" → "Web Service"
   - Connect your GitHub account
   - Select your `snapix` repository
   - Click "Connect"

2. **Configure Build Settings**
   ```yaml
   Name: snapix (or your preferred name)
   Region: Oregon (US West) or closest to your users
   Branch: master
   Runtime: Node
   Build Command: yarn install && yarn build
   Start Command: yarn start
   ```

3. **Add Environment Variables**
   Click "Advanced" → Add these environment variables:
   
   ```
   NODE_ENV=production
   MONGODB_URI=your_mongodb_connection_string
   FACEBOOK_APP_ID=your_facebook_app_id
   FACEBOOK_APP_SECRET=your_facebook_app_secret
   JWT_SECRET=your_generated_jwt_secret
   JWT_REFRESH_SECRET=your_generated_refresh_secret
   SESSION_SECRET=your_generated_session_secret
   CLIENT_URL=https://your-app-name.onrender.com
   ```

4. **Deploy**
   - Click "Create Web Service"
   - Render will automatically build and deploy your app
   - Wait for deployment to complete (usually 2-5 minutes)

### Option B: Using render.yaml (Infrastructure as Code)

1. **Update render.yaml**
   The `render.yaml` file is already configured in your repo. Just update environment variables:
   
   ```yaml
   # Edit render.yaml and update these values:
   - key: MONGODB_URI
     value: your_mongodb_connection_string
   - key: FACEBOOK_APP_ID
     value: your_facebook_app_id
   - key: FACEBOOK_APP_SECRET
     value: your_facebook_app_secret
   ```

2. **Deploy via Git**
   ```bash
   git add .
   git commit -m "Configure production environment variables"
   git push origin master
   ```

3. **Create Service in Render**
   - Go to Render Dashboard
   - Click "New +" → "Blueprint"
   - Connect repository
   - Render will read your `render.yaml` and configure everything automatically

## 🔄 Step 5: Post-Deployment Configuration

### Update Facebook App URLs

1. **Get Your Render App URL**
   - From Render dashboard, copy your app URL (e.g., `https://snapix-abc123.onrender.com`)

2. **Update Facebook App Settings**
   - Go back to Facebook Developer Console
   - Update OAuth Redirect URIs with your actual Render URL:
     ```
     https://snapix-abc123.onrender.com/api/auth/facebook/callback
     ```

3. **Update CLIENT_URL Environment Variable**
   - In Render dashboard, go to your service
   - Click "Environment"
   - Update `CLIENT_URL` with your actual Render URL
   - Click "Save Changes" (this will trigger a redeploy)

## ✅ Step 6: Verification & Testing

### Health Checks
1. **Verify App is Running**
   ```
   https://your-app-name.onrender.com/health
   ```
   Should return: `{"status":"healthy","timestamp":"...","uptime":...,"environment":"production"}`

2. **API Health Check**
   ```
   https://your-app-name.onrender.com/api/health
   ```
   Should return: `{"success":true,"status":"healthy","environment":"production","timestamp":"..."}`

### Functionality Testing
1. **Guest Login**
   - Visit your app URL
   - Click "Continue as Guest"
   - Verify you reach the dashboard with guest features

2. **Facebook Login**
   - Click "Continue with Facebook"
   - Should redirect to Facebook OAuth
   - After authorization, should redirect back to your app
   - Verify authenticated features work

3. **Navigation & Features**
   - Test all routes and navigation
   - Verify API calls work correctly
   - Check browser console for any errors

## 🔍 Troubleshooting

### Common Build Issues

**Build fails with "Module not found"**
```bash
# Solution: Ensure all dependencies are in package.json
yarn add missing-package-name
git commit -am "Add missing dependency"
git push
```

**TypeScript compilation errors**
```bash
# Solution: Fix TypeScript errors locally first
yarn type-check  # Run locally
# Fix any errors, then commit and push
```

### Common Runtime Issues

**500 Internal Server Error**
- Check Render logs in dashboard
- Verify all environment variables are set correctly
- Check MongoDB Atlas connection and IP whitelist

**Facebook OAuth "Invalid redirect URI"**
- Verify Facebook app redirect URLs exactly match your Render URL
- Ensure no trailing slashes or typos
- Check that URLs use `https://` not `http://`

**Database Connection Issues**
- Verify MongoDB Atlas connection string is correct
- Check that database user has proper permissions
- Ensure network access allows connections from anywhere (0.0.0.0/0)

### Logs & Monitoring

**View Application Logs**
1. Go to Render Dashboard
2. Select your service
3. Click "Logs" tab
4. Monitor real-time logs for errors

**Performance Monitoring**
1. Check "Metrics" tab in Render dashboard
2. Monitor CPU and memory usage
3. Consider upgrading plan if resource limits are hit

## 🔒 Security Considerations

### Production Security Checklist
- [x] HTTPS enforced (Render provides this automatically)
- [x] Environment variables stored securely (not in code)
- [x] Database connection uses SSL/TLS
- [x] CORS configured for production domain only
- [x] Security headers enabled via Helmet.js
- [x] JWT secrets are strong and unique
- [x] Session secrets are secure

### Ongoing Security
- Regularly update dependencies
- Monitor for security advisories
- Review access logs periodically
- Consider adding rate limiting for production traffic

## 📈 Scaling & Optimization

### Performance Optimization
- **CDN**: Consider adding Cloudflare or similar CDN
- **Database**: Add indexes to frequently queried fields
- **Caching**: Implement Redis for session storage (optional)
- **Monitoring**: Add application performance monitoring (APM)

### Scaling Options
- **Horizontal Scaling**: Render automatically handles load balancing
- **Vertical Scaling**: Upgrade Render plan for more CPU/memory
- **Database Scaling**: Upgrade MongoDB Atlas plan as needed

## 🎯 Next Steps

After successful deployment:

1. **Set up Monitoring**
   - Configure uptime monitoring (UptimeRobot, Pingdom)
   - Set up error tracking (Sentry, Rollbar)
   - Monitor application metrics

2. **Backup Strategy**
   - MongoDB Atlas automated backups (included)
   - Consider additional backup solutions for critical data

3. **CI/CD Enhancement**
   - Add automated testing to deployment pipeline
   - Set up staging environment for testing changes
   - Implement blue-green deployments

4. **Custom Domain (Optional)**
   - Purchase domain name
   - Configure DNS to point to Render
   - Add custom domain in Render dashboard
   - Update Facebook app settings with new domain

## 🆘 Support & Resources

### Documentation Links
- [Render.com Documentation](https://render.com/docs)
- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/)
- [Facebook for Developers](https://developers.facebook.com/docs/)

### Community Support
- [Render.com Community](https://render.com/community)
- [Snapix GitHub Issues](https://github.com/your-username/snapix/issues)

---

## 🎉 Congratulations!

Your Snapix application is now deployed and ready for production use! 

**Your deployment includes:**
- ✅ Full-stack application (React frontend + Node.js backend)
- ✅ Facebook OAuth authentication
- ✅ Guest login functionality  
- ✅ MongoDB database integration
- ✅ Production-ready security configurations
- ✅ Health monitoring endpoints
- ✅ Automatic HTTPS and SSL certificates
- ✅ CI/CD pipeline via GitHub integration

**What users can do:**
- Sign up/login with Facebook OAuth
- Use the app as a guest (limited features)
- Access Facebook integration features (if authenticated)
- Seamless experience across all routes

Remember to monitor your application logs and performance metrics regularly, and keep your dependencies updated for security and performance improvements.