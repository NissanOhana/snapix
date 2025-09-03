# 🚀 Snapix Deployment Checklist

## Prerequisites Setup

### ☑️ 1. Accounts & Services Required
- [ ] **GitHub Account** with Snapix repository pushed
- [ ] **Render.com Account** (free tier available)
- [ ] **MongoDB Atlas Account** (free tier available) 
- [ ] **Facebook Developer Account** with Business App
- [ ] **OpenAI Account** (optional - for AI features)

---

## 🗄️ Database Setup (MongoDB Atlas)

### ☑️ 2. MongoDB Atlas Configuration
- [ ] **Create MongoDB Atlas Account** at https://cloud.mongodb.com
- [ ] **Create New Cluster** (M0 Sandbox - Free)
- [ ] **Create Database User:**
  - Username: `snapix_user`
  - Password: Generate strong password
  - Role: `readWriteAnyDatabase`
- [ ] **Network Access:** Add IP `0.0.0.0/0` (allow from anywhere)
- [ ] **Get Connection String:**
  ```
  mongodb+srv://snapix_user:<password>@cluster0.xxxxx.mongodb.net/snapix?retryWrites=true&w=majority
  ```
- [ ] **Test Connection** (optional but recommended)

---

## 🔑 Environment Variables Preparation

### ☑️ 3. Generate Secure Keys
Run these commands locally to generate secure secrets:

```bash
# Generate JWT secrets
node -e "console.log('JWT_SECRET=' + require('crypto').randomBytes(64).toString('hex'))"
node -e "console.log('JWT_REFRESH_SECRET=' + require('crypto').randomBytes(64).toString('hex'))"
node -e "console.log('SESSION_SECRET=' + require('crypto').randomBytes(64).toString('hex'))"
```

### ☑️ 4. Collect Environment Variables
Prepare these values for deployment:

**Required:**
- [ ] `MONGODB_URI` - From MongoDB Atlas (step 2)
- [ ] `FACEBOOK_APP_ID` - From Facebook Developer Console
- [ ] `FACEBOOK_APP_SECRET` - From Facebook Developer Console  
- [ ] `JWT_SECRET` - Generated above
- [ ] `JWT_REFRESH_SECRET` - Generated above
- [ ] `SESSION_SECRET` - Generated above

**Optional:**
- [ ] `OPENAI_API_KEY` - For AI chat features
- [ ] `N8N_WEBHOOK_URL` - For automation workflows
- [ ] `N8N_API_KEY` - For n8n integration

---

## 📱 Facebook App Configuration

### ☑️ 5. Facebook Developer Console Setup
- [ ] **Go to:** https://developers.facebook.com/apps/1413341963126218/
- [ ] **App Settings → Basic:**
  - [ ] Verify App ID: `1413341963126218`
  - [ ] Copy App Secret
- [ ] **Facebook Login for Business → Settings:**
  - [ ] **Valid OAuth Redirect URIs:** Add both:
    ```
    https://your-app-name.onrender.com/api/auth/facebook/callback
    https://your-app-name.onrender.com/auth-facebook
    ```
  - [ ] **Client OAuth Login:** `Yes`
  - [ ] **Web OAuth Login:** `Yes` 
  - [ ] **Enforce HTTPS:** `Yes`
- [ ] **App Review:** 
  - [ ] Submit for `ads_read` permission review
  - [ ] Submit for `ads_management` permission review
  - [ ] Add testing instructions for reviewers

### ☑️ 6. Facebook Permissions Setup
For production, you'll need these permissions reviewed:
- [ ] `public_profile` ✅ (approved by default)
- [ ] `ads_read` ⏳ (requires review)  
- [ ] `ads_management` ⏳ (requires review)

---

## 🚀 Render.com Deployment

### ☑️ 7. Create New Web Service
- [ ] **Go to:** https://render.com/dashboard
- [ ] **Click:** "New +" → "Web Service"
- [ ] **Connect Repository:** Select your GitHub/Snapix repo
- [ ] **Configure Service:**
  - **Name:** `snapix-app` (or your preferred name)
  - **Environment:** `Node`
  - **Region:** Choose closest to your users
  - **Branch:** `master`
  - **Build Command:** `yarn install && yarn build`
  - **Start Command:** `yarn start`
  - **Plan:** Free (or paid for custom domain)

### ☑️ 8. Environment Variables in Render
Add all environment variables in Render dashboard:

```env
NODE_ENV=production
PORT=10000
MONGODB_URI=mongodb+srv://snapix_user:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/snapix?retryWrites=true&w=majority
FACEBOOK_APP_ID=1413341963126218  
FACEBOOK_APP_SECRET=YOUR_FACEBOOK_SECRET
JWT_SECRET=YOUR_GENERATED_JWT_SECRET
JWT_REFRESH_SECRET=YOUR_GENERATED_REFRESH_SECRET
SESSION_SECRET=YOUR_GENERATED_SESSION_SECRET
CLIENT_URL=https://your-app-name.onrender.com
FACEBOOK_GRAPH_VERSION=v19.0
OPENAI_API_KEY=YOUR_OPENAI_KEY (optional)
```

### ☑️ 9. Deploy & Test
- [ ] **Deploy:** Click "Create Web Service"
- [ ] **Wait for Build:** Check build logs for errors
- [ ] **Get App URL:** `https://your-app-name.onrender.com`
- [ ] **Test Health Check:** Visit `/health` endpoint
- [ ] **Test Frontend:** Visit root URL

---

## 🔧 Post-Deployment Configuration

### ☑️ 10. Update Facebook App URLs
After deployment, update Facebook app with production URLs:
- [ ] **Valid OAuth Redirect URIs:**
  ```
  https://your-actual-app-name.onrender.com/api/auth/facebook/callback
  https://your-actual-app-name.onrender.com/auth-facebook
  ```
- [ ] **App Domains:** Add `your-actual-app-name.onrender.com`
- [ ] **Site URL:** `https://your-actual-app-name.onrender.com`

### ☑️ 11. Test Complete Flow
- [ ] **Visit App:** https://your-app-name.onrender.com
- [ ] **Test Facebook Login:** Complete OAuth flow
- [ ] **Test Ad Account Selection:** Select an ad account
- [ ] **Test Campaign Data:** Verify data loads
- [ ] **Test AI Chat:** Send message (if OpenAI configured)
- [ ] **Test Guest Login:** Verify guest mode works

---

## 🔒 Security & Performance

### ☑️ 12. Production Hardening
- [ ] **Custom Domain:** (Optional) Configure custom domain in Render
- [ ] **SSL Certificate:** Verify HTTPS is working
- [ ] **MongoDB Security:** Review network access settings
- [ ] **Facebook Permissions:** Ensure only required permissions
- [ ] **API Rate Limits:** Monitor Facebook API usage
- [ ] **Error Monitoring:** Set up error tracking (optional)

---

## 📊 Monitoring & Maintenance

### ☑️ 13. Set Up Monitoring
- [ ] **Render Metrics:** Monitor app performance in dashboard
- [ ] **MongoDB Metrics:** Check database usage in Atlas
- [ ] **Facebook API Usage:** Monitor in Facebook Developer Console
- [ ] **Error Logs:** Check Render logs for errors
- [ ] **Uptime Monitoring:** (Optional) Set up external monitoring

---

## 🆘 Troubleshooting Common Issues

### Database Connection Issues
- [ ] Check MongoDB Atlas IP whitelist includes `0.0.0.0/0`
- [ ] Verify MongoDB URI format and credentials
- [ ] Check MongoDB Atlas cluster status

### Facebook Auth Issues  
- [ ] Verify redirect URIs match exactly (including HTTPS)
- [ ] Check Facebook app is in "Live" mode for production
- [ ] Ensure required permissions are approved

### Build/Deploy Issues
- [ ] Check Render build logs for specific errors
- [ ] Verify all environment variables are set
- [ ] Ensure build command matches package.json scripts

---

## 📝 Final Deployment Summary

Once all checkboxes are complete:

✅ **Your app will be live at:** `https://your-app-name.onrender.com`  
✅ **Facebook OAuth will work** with production redirect URLs  
✅ **Database will be persistent** via MongoDB Atlas  
✅ **AI features will work** if OpenAI API key provided  
✅ **Campaign data will sync** from Facebook with proper permissions  

### Expected Timeline
- **Setup:** 30-60 minutes
- **Facebook Review:** 2-7 business days (for ads permissions)
- **Total to Full Production:** 1 week

### Support Resources
- **Render Docs:** https://render.com/docs
- **MongoDB Atlas Docs:** https://docs.atlas.mongodb.com
- **Facebook Developer Docs:** https://developers.facebook.com/docs

---

**🎉 Ready to deploy? Start with step 1 and work through each checkbox!**