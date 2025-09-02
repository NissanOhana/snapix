#!/usr/bin/env node
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const axios = require('axios');

async function verifyFacebookApp() {
  console.log('\n🔍 Facebook OAuth Configuration Check\n');
  console.log('═══════════════════════════════════════\n');
  
  // Check environment variables
  console.log('📋 Environment Variables:');
  console.log(`✓ FACEBOOK_APP_ID: ${process.env.FACEBOOK_APP_ID ? '✅ Set' : '❌ Missing'}`);
  console.log(`✓ FACEBOOK_APP_SECRET: ${process.env.FACEBOOK_APP_SECRET ? '✅ Set (hidden)' : '❌ Missing'}`);
  console.log(`✓ FACEBOOK_CALLBACK_URL: ${process.env.FACEBOOK_CALLBACK_URL || '❌ Missing'}`);
  console.log(`✓ CLIENT_URL: ${process.env.CLIENT_URL || '❌ Missing'}`);
  console.log(`✓ PORT: ${process.env.PORT || '5000'}`);
  
  console.log('\n📝 Required Facebook App Settings:');
  console.log('─────────────────────────────────');
  console.log('1. App Mode: Development Mode (MUST be ON)');
  console.log('2. App Domains: localhost');
  console.log(`3. Site URL: http://localhost:${process.env.PORT || '5000'}`);
  console.log(`4. Valid OAuth Redirect URIs: ${process.env.FACEBOOK_CALLBACK_URL}`);
  
  console.log('\n🔗 OAuth Flow URLs:');
  console.log('─────────────────────');
  console.log(`Login URL: http://localhost:${process.env.PORT || '5000'}/api/auth/facebook`);
  console.log(`Callback URL: ${process.env.FACEBOOK_CALLBACK_URL}`);
  console.log(`Client Redirect: ${process.env.CLIENT_URL}/auth/callback`);
  
  // Try to verify app token (optional)
  if (process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET) {
    try {
      console.log('\n🔐 Verifying App Token...');
      const response = await axios.get('https://graph.facebook.com/oauth/access_token', {
        params: {
          client_id: process.env.FACEBOOK_APP_ID,
          client_secret: process.env.FACEBOOK_APP_SECRET,
          grant_type: 'client_credentials'
        }
      });
      
      if (response.data.access_token) {
        console.log('✅ App credentials are valid!');
        
        // Get app info
        const appInfo = await axios.get(`https://graph.facebook.com/${process.env.FACEBOOK_APP_ID}`, {
          params: {
            access_token: response.data.access_token,
            fields: 'name,namespace'
          }
        });
        
        console.log(`✅ App Name: ${appInfo.data.name}`);
        if (appInfo.data.namespace) {
          console.log(`✅ App Namespace: ${appInfo.data.namespace}`);
        }
      }
    } catch (error) {
      console.log('❌ Failed to verify app credentials:', error.response?.data?.error?.message || error.message);
      console.log('\nPossible issues:');
      console.log('- App might not be in development mode');
      console.log('- App ID or Secret might be incorrect');
      console.log('- App might be restricted or disabled');
    }
  }
  
  console.log('\n📚 Quick Fix Guide:');
  console.log('═══════════════════');
  console.log('1. Go to https://developers.facebook.com/apps/' + process.env.FACEBOOK_APP_ID);
  console.log('2. Toggle to Development Mode (top-right)');
  console.log('3. Settings → Basic → Add "localhost" to App Domains');
  console.log('4. Settings → Basic → Add Platform → Website → Site URL: http://localhost:' + (process.env.PORT || '5000'));
  console.log('5. Facebook Login → Settings → Valid OAuth Redirect URIs → Add: ' + process.env.FACEBOOK_CALLBACK_URL);
  console.log('\n✨ Done! Your app should now work with localhost.\n');
}

verifyFacebookApp().catch(console.error);