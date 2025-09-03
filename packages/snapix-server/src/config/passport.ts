import passport from 'passport';
import { Strategy as FacebookStrategy } from 'passport-facebook';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import User from '../models/User';

// Facebook Strategy
passport.use(
  new FacebookStrategy(
    {
      clientID: process.env.FACEBOOK_APP_ID!,
      clientSecret: process.env.FACEBOOK_APP_SECRET!,
      callbackURL: process.env.FACEBOOK_CALLBACK_URL!,
      // Only request fields that don't require additional permissions
      profileFields: ['id', 'displayName', 'name', 'photos'],
      enableProof: true,
      passReqToCallback: false,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Debug logging
        console.log('Facebook Profile:', JSON.stringify(profile, null, 2));
        console.log('Profile _json:', profile._json);
        
        let user = await User.findOne({ facebookId: profile.id });

        if (user) {
          // Update existing user
          user.facebookTokens = { accessToken, refreshToken };
          user.lastLogin = new Date();
          await user.save();
        } else {
          // Since we're not requesting email permission, generate a unique placeholder
          const email = `fb_${profile.id}@facebook.local`;
          const username = `fb_${profile.id}`;
            
          const displayName = profile.displayName || 
            `${profile.name?.givenName || ''} ${profile.name?.familyName || ''}`.trim() ||
            `User${profile.id}`;

          // Create new user
          user = await User.create({
            facebookId: profile.id,
            username: username,
            email: email,
            name: displayName,
            password: `facebook_oauth_${profile.id}_${Date.now()}`, // Random password for OAuth users
            profilePicture: profile.photos?.[0]?.value,
            facebookTokens: { accessToken, refreshToken },
            lastLogin: new Date(),
          });
        }

        return done(null, user);
      } catch (error) {
        return done(error as Error, false);
      }
    }
  )
);

// Google Strategy (only if environment variables are provided)
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && process.env.GOOGLE_CALLBACK_URL) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL,
        scope: ['profile', 'email'],
      },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Debug logging
        console.log('Google Profile:', JSON.stringify(profile, null, 2));
        console.log('Profile emails:', profile.emails);
        
        let user = await User.findOne({ googleId: profile.id });

        if (user) {
          // Update existing user
          user.googleTokens = { accessToken, refreshToken };
          user.lastLogin = new Date();
          await user.save();
        } else {
          // Check if user exists with same email
          const email = profile.emails?.[0]?.value;
          let existingUser = null;
          
          if (email) {
            existingUser = await User.findOne({ email });
          }

          if (existingUser) {
            // Link Google account to existing user
            existingUser.googleId = profile.id;
            existingUser.googleTokens = { accessToken, refreshToken };
            existingUser.lastLogin = new Date();
            await existingUser.save();
            user = existingUser;
          } else {
            // Create new user
            const displayName = profile.displayName || 
              `${profile.name?.givenName || ''} ${profile.name?.familyName || ''}`.trim() ||
              `User${profile.id}`;

            user = await User.create({
              googleId: profile.id,
              username: `google_${profile.id}`,
              email: email || `google_${profile.id}@gmail.local`,
              name: displayName,
              password: `google_oauth_${profile.id}_${Date.now()}`, // Random password for OAuth users
              profilePicture: profile.photos?.[0]?.value,
              googleTokens: { accessToken, refreshToken },
              lastLogin: new Date(),
            });
          }
        }

        return done(null, user);
      } catch (error) {
        return done(error as Error, false);
      }
    }
    )
  );
} else {
  console.log('⚠️ Google OAuth not configured - GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, or GOOGLE_CALLBACK_URL missing');
}

// JWT Strategy
passport.use(
  new JwtStrategy(
    {
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SECRET!,
    },
    async (payload, done) => {
      try {
        const user = await User.findById(payload.id);
        if (user && user.isActive) {
          return done(null, user);
        }
        return done(null, false);
      } catch (error) {
        return done(error, false);
      }
    }
  )
);

export default passport;