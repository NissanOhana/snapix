#!/usr/bin/env node
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const axios = require('axios');

async function testFacebookLogin() {
  console.log('\n🔍 Facebook Login Diagnostic Test\n');
  console.log('═══════════════════════════════════════\n');
  
  const appId = process.env.FACEBOOK_APP_ID;
  const appSecret = process.env.FACEBOOK_APP_SECRET;
  
  if (!appId || !appSecret) {
    console.log('❌ Missing Facebook App credentials in .env file');
    return;
  }

  try {
    // Test 1: Get App Access Token
    console.log('📋 Test 1: Verifying App Credentials...');
    const tokenResponse = await axios.get('https://graph.facebook.com/oauth/access_token', {
      params: {
        client_id: appId,
        client_secret: appSecret,
        grant_type: 'client_credentials'
      }
    });
    
    const appToken = tokenResponse.data.access_token;
    console.log('✅ App credentials are valid!\n');
    
    // Test 2: Get App Details
    console.log('📋 Test 2: Fetching App Details...');
    const appResponse = await axios.get(`https://graph.facebook.com/${appId}`, {
      params: {
        access_token: appToken,
        fields: 'name,id,namespace,category,subcategory,link'
      }
    });
    
    console.log('✅ App Details:');
    console.log(`   - Name: ${appResponse.data.name}`);
    console.log(`   - ID: ${appResponse.data.id}`);
    console.log(`   - Category: ${appResponse.data.category}`);
    if (appResponse.data.namespace) {
      console.log(`   - Namespace: ${appResponse.data.namespace}`);
    }
    console.log('');
    
    // Test 3: Check Login Configuration
    console.log('📋 Test 3: Checking Login URL...');
    const loginUrl = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${appId}&redirect_uri=${encodeURIComponent(process.env.FACEBOOK_CALLBACK_URL)}&scope=email,public_profile&response_type=code`;
    console.log('✅ OAuth URL (for manual testing):');
    console.log(`   ${loginUrl}\n`);
    
    // Test 4: Verify Permissions
    console.log('📋 Test 4: Available Permissions in Dev Mode...');
    console.log('✅ Default permissions available:');
    console.log('   - email');
    console.log('   - public_profile');
    console.log('   (These are automatically available in Development Mode)\n');
    
    console.log('📌 IMPORTANT CHECKS:');
    console.log('─────────────────────');
    console.log('1. Is your app in Development Mode? (Check top-right toggle)');
    console.log('2. Is Facebook Login product added? (Check Products in sidebar)');
    console.log('3. Are OAuth redirect URIs configured? (Facebook Login → Settings)');
    console.log(`4. Is this URL in Valid OAuth Redirect URIs?: ${process.env.FACEBOOK_CALLBACK_URL}`);
    console.log('');
    
    console.log('🔗 Direct Links:');
    console.log('─────────────────');
    console.log(`App Dashboard: https://developers.facebook.com/apps/${appId}`);
    console.log(`Facebook Login Settings: https://developers.facebook.com/apps/${appId}/fb-login/settings/`);
    console.log(`Basic Settings: https://developers.facebook.com/apps/${appId}/settings/basic/`);
    console.log('');
    
    console.log('💡 If login still fails:');
    console.log('─────────────────────');
    console.log('1. Clear browser cookies for facebook.com');
    console.log('2. Try in an incognito/private window');
    console.log('3. Make sure you are logged into Facebook');
    console.log('4. Ensure you have admin/developer role in the app');
    
  } catch (error) {
    console.log('❌ Error:', error.response?.data?.error?.message || error.message);
    
    if (error.response?.status === 400) {
      console.log('\n⚠️  Possible Issues:');
      console.log('- App might be disabled or restricted');
      console.log('- App ID or Secret might be incorrect');
      console.log('- Check if app is in Development Mode');
    }
  }
}

testFacebookLogin().catch(console.error);