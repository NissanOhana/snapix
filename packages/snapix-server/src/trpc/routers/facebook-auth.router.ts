import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import facebookService from '../../services/facebook.service';
import { optionalEnvVars } from '../../env';

export const facebookAuthRouter = router({
  // Step 1: Exchange OAuth code for access token and get ad accounts list
  handleOAuth: protectedProcedure
    .input(z.object({
      code: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        const { code } = input;
        const userEmail = ctx.user.email;
        
        console.log(`🔗 Processing Facebook OAuth for user: ${userEmail}`);
        
        // Construct the redirect URI
        const redirectUri = `${optionalEnvVars.CLIENT_URL}/auth-facebook`;
        
        // Exchange code for access token
        const accessToken = await facebookService.exchangeCodeForToken(code, redirectUri);
        
        // Get user's ad accounts
        const adAccounts = await facebookService.getUserAdAccounts(accessToken);
        
        // Store access token temporarily (we'll clean this up later)
        // For now, we'll return the data and handle token storage on account selection
        
        return {
          success: true,
          requiresAccountSelection: true,
          adAccounts: adAccounts.map(account => ({
            id: account.id,
            name: account.name,
            account_id: account.account_id,
            currency: account.currency,
            status: account.account_status
          })),
          // We'll pass the access token temporarily for the next step
          // In production, consider storing this encrypted in cache/session
          _tempAccessToken: accessToken
        };
      } catch (error: any) {
        console.error('Facebook OAuth error:', error.message);
        throw new Error(`Facebook authentication failed: ${error.message}`);
      }
    }),

  // Step 2: User selects an ad account to connect
  selectAdAccount: protectedProcedure
    .input(z.object({
      selectedAccountId: z.string(),
      accessToken: z.string(), // Temporary token from step 1
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        const { selectedAccountId, accessToken } = input;
        const userEmail = ctx.user.email;
        
        // Save the selected ad account
        const selectedAccount = await facebookService.saveAdAccount(
          userEmail, 
          selectedAccountId, 
          accessToken
        );
        
        return {
          success: true,
          message: 'Ad Account connected successfully!',
          account: {
            name: selectedAccount.name,
            account_id: selectedAccount.account_id,
            currency: selectedAccount.currency
          }
        };
      } catch (error: any) {
        console.error('Ad account selection error:', error.message);
        throw new Error(`Failed to connect ad account: ${error.message}`);
      }
    }),

  // Get current connected ad account
  getConnectedAccount: protectedProcedure
    .query(async ({ ctx }) => {
      try {
        const userEmail = ctx.user.email;
        const account = await facebookService.getConnectedAdAccount(userEmail);
        
        if (!account) {
          return { connected: false, account: null };
        }
        
        return {
          connected: true,
          account: {
            account_id: account.account_id,
            account_name: account.account_name,
            currency: account.currency,
            status: account.status,
            last_sync: account.last_sync
          }
        };
      } catch (error: any) {
        console.error('Get connected account error:', error.message);
        return { connected: false, account: null };
      }
    }),

  // Disconnect ad account
  disconnectAccount: protectedProcedure
    .mutation(async ({ ctx }) => {
      try {
        const userEmail = ctx.user.email;
        
        // Update status to disconnected instead of deleting
        const account = await facebookService.getConnectedAdAccount(userEmail);
        if (account) {
          account.status = 'disconnected';
          account.access_token = undefined; // Clear the token
          await account.save();
        }
        
        return {
          success: true,
          message: 'Ad account disconnected successfully'
        };
      } catch (error: any) {
        console.error('Disconnect account error:', error.message);
        throw new Error(`Failed to disconnect ad account: ${error.message}`);
      }
    })
});