#!/usr/bin/env node

require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

console.log('🔍 Facebook Configuration Diagnostic');
console.log('=====================================\n');

// Check environment variables
console.log('✅ Environment Variables:');
console.log('FACEBOOK_APP_ID:', process.env.FACEBOOK_APP_ID ? '✓ Set' : '✗ Missing');
console.log('FACEBOOK_APP_SECRET:', process.env.FACEBOOK_APP_SECRET ? '✓ Set (hidden)' : '✗ Missing');
console.log('FACEBOOK_CALLBACK_URL:', process.env.FACEBOOK_CALLBACK_URL || '✗ Missing');
console.log('CLIENT_URL:', process.env.CLIENT_URL || '✗ Missing');
console.log('PORT:', process.env.PORT || '5000');

console.log('\n📋 Required Facebook App Settings:');
console.log('1. App Status: Should be "In Development" or "Live"');
console.log('2. Products: "Facebook Login" must be added');
console.log('3. Settings → Basic:');
console.log('   - App Domains: Add "localhost"');
console.log('   - Site URL: http://localhost:3000');
console.log('4. Facebook Login → Settings:');
console.log('   - Valid OAuth Redirect URIs: ' + (process.env.FACEBOOK_CALLBACK_URL || 'NOT SET'));
console.log('   - Client OAuth Login: Yes');
console.log('   - Web OAuth Login: Yes');
console.log('   - Force Web OAuth Reauthentication: No');
console.log('   - Use Strict Mode for redirect URIs: Yes (recommended)');

console.log('\n🔗 URLs for Testing:');
console.log('Login URL: http://localhost:' + (process.env.PORT || '5000') + '/api/auth/facebook');
console.log('Expected Callback: ' + (process.env.FACEBOOK_CALLBACK_URL || 'NOT SET'));

console.log('\n⚠️  Common Issues:');
console.log('1. "public_profile" permission is always granted and doesn\'t need approval');
console.log('2. "email" permission works in development mode without approval');
console.log('3. Facebook may NOT return email if:');
console.log('   - User signed up with phone number');
console.log('   - User hasn\'t confirmed their email');
console.log('   - Privacy settings restrict email sharing');

console.log('\n🚀 Next Steps:');
console.log('1. Start your server: npm run dev');
console.log('2. Check server logs for debug output');
console.log('3. Try logging in via: http://localhost:' + (process.env.PORT || '5000') + '/api/auth/facebook');
console.log('4. Watch console for "Facebook Profile:" debug output');

if (!process.env.FACEBOOK_APP_ID || !process.env.FACEBOOK_APP_SECRET || !process.env.FACEBOOK_CALLBACK_URL) {
  console.log('\n❌ ERROR: Missing required environment variables!');
  process.exit(1);
} else {
  console.log('\n✅ All required environment variables are set!');
}