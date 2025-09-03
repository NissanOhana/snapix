import { trpc } from '@/lib/trpc';
import { useState } from 'react';

export interface FacebookAdAccount {
  id: string;
  name: string;
  account_id: string;
  currency: string;
  status: string;
}

export const useFacebookAuth = () => {
  const [isProcessingAuth, setIsProcessingAuth] = useState(false);
  
  // Get connected account status
  const {
    data: connectedAccountData,
    isLoading: isCheckingConnection,
    refetch: refetchConnection,
  } = trpc.facebookAuth.getConnectedAccount.useQuery();

  // Handle OAuth step 1 - exchange code for ad accounts
  const handleOAuthMutation = trpc.facebookAuth.handleOAuth.useMutation();

  // Handle OAuth step 2 - select ad account
  const selectAdAccountMutation = trpc.facebookAuth.selectAdAccount.useMutation();

  // Disconnect ad account
  const disconnectMutation = trpc.facebookAuth.disconnectAccount.useMutation();

  const startFacebookAuth = () => {
    const clientUrl = window.location.origin;
    const facebookAuthUrl = `https://www.facebook.com/v19.0/dialog/oauth?client_id=${import.meta.env.VITE_FACEBOOK_APP_ID}&redirect_uri=${encodeURIComponent(clientUrl + '/auth-facebook')}&scope=public_profile,ads_read,ads_management&response_type=code`;
    
    // Store current location to redirect back after auth
    localStorage.setItem('authRedirect', window.location.pathname);
    
    // Redirect to Facebook OAuth
    window.location.href = facebookAuthUrl;
  };

  const handleOAuthCode = async (code: string) => {
    try {
      setIsProcessingAuth(true);
      const result = await handleOAuthMutation.mutateAsync({ code });
      
      if (result.requiresAccountSelection) {
        return {
          success: true,
          requiresAccountSelection: true,
          adAccounts: result.adAccounts,
          _tempAccessToken: result._tempAccessToken,
        };
      }
      
      return result;
    } catch (error: any) {
      console.error('Facebook OAuth error:', error);
      throw error;
    } finally {
      setIsProcessingAuth(false);
    }
  };

  const selectAdAccount = async (selectedAccountId: string, accessToken: string) => {
    try {
      setIsProcessingAuth(true);
      const result = await selectAdAccountMutation.mutateAsync({
        selectedAccountId,
        accessToken,
      });
      
      // Refresh connection status after successful selection
      await refetchConnection();
      
      return result;
    } catch (error: any) {
      console.error('Ad account selection error:', error);
      throw error;
    } finally {
      setIsProcessingAuth(false);
    }
  };

  const disconnectFacebookAccount = async () => {
    try {
      const result = await disconnectMutation.mutateAsync();
      
      // Refresh connection status after disconnection
      await refetchConnection();
      
      return result;
    } catch (error: any) {
      console.error('Disconnect error:', error);
      throw error;
    }
  };

  return {
    // State
    isProcessingAuth,
    isCheckingConnection,
    
    // Connected account info
    isConnected: connectedAccountData?.connected || false,
    connectedAccount: connectedAccountData?.account || null,
    
    // Actions
    startFacebookAuth,
    handleOAuthCode,
    selectAdAccount,
    disconnectFacebookAccount,
    refetchConnection,
    
    // Mutation states
    isHandlingOAuth: handleOAuthMutation.isLoading,
    isSelectingAccount: selectAdAccountMutation.isLoading,
    isDisconnecting: disconnectMutation.isLoading,
    
    // Errors
    oauthError: handleOAuthMutation.error,
    selectionError: selectAdAccountMutation.error,
    disconnectError: disconnectMutation.error,
  };
};