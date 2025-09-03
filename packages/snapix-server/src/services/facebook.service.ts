import axios from 'axios';
import AdAccount from '../models/AdAccount';
import { optionalEnvVars } from '../env';

interface FacebookTokenResponse {
  access_token: string;
  token_type: string;
  expires_in?: number;
}

interface FacebookAdAccount {
  id: string;
  name: string;
  account_id: string;
  currency: string;
  account_status: string;
}

export class FacebookService {
  private baseURL = `https://graph.facebook.com/${optionalEnvVars.FACEBOOK_GRAPH_VERSION}`;

  async exchangeCodeForToken(code: string, redirectUri: string): Promise<string> {
    try {
      const tokenUrl = `${this.baseURL}/oauth/access_token`;
      const response = await axios.get(tokenUrl, {
        params: {
          client_id: process.env.FACEBOOK_APP_ID,
          client_secret: process.env.FACEBOOK_APP_SECRET,
          redirect_uri: redirectUri,
          code,
        },
      });

      const data = response.data as FacebookTokenResponse;
      if (!data.access_token) {
        throw new Error('No access token received from Facebook');
      }

      return data.access_token;
    } catch (error: any) {
      console.error('Facebook token exchange error:', error.response?.data || error.message);
      throw new Error(`Facebook token exchange failed: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  async getUserData(accessToken: string) {
    try {
      const response = await axios.get(`${this.baseURL}/me`, {
        params: {
          fields: 'id,name,email,picture.type(large)',
          access_token: accessToken,
        },
      });
      return response.data;
    } catch (error: any) {
      console.error('Facebook API Error:', error.response?.data || error.message);
      throw new Error('Failed to fetch Facebook user data');
    }
  }

  async getUserAdAccounts(accessToken: string): Promise<FacebookAdAccount[]> {
    try {
      const response = await axios.get(`${this.baseURL}/me/adaccounts`, {
        params: {
          fields: 'id,name,account_id,currency,account_status',
          access_token: accessToken,
        },
      });

      if (!response.data.data || response.data.data.length === 0) {
        throw new Error('No ad accounts found for this Facebook profile');
      }

      return response.data.data;
    } catch (error: any) {
      console.error('Facebook ad accounts error:', error.response?.data || error.message);
      throw new Error(`Failed to fetch Facebook ad accounts: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  async saveAdAccount(userEmail: string, selectedAccountId: string, accessToken: string): Promise<any> {
    try {
      // Get fresh ad accounts data
      const adAccounts = await this.getUserAdAccounts(accessToken);
      const selectedAccount = adAccounts.find(acc => acc.id === selectedAccountId);
      
      if (!selectedAccount) {
        throw new Error('Selected ad account not found');
      }

      // Clean up any existing accounts for this user
      await AdAccount.deleteMany({ created_by: userEmail });

      // Save the selected ad account
      const adAccount = new AdAccount({
        account_id: selectedAccount.account_id,
        account_name: selectedAccount.name,
        access_token: accessToken,
        currency: selectedAccount.currency,
        status: 'connected',
        created_by: userEmail,
        created_by_email: userEmail,
        owner_email: userEmail,
        last_sync: new Date(),
      });

      await adAccount.save();
      return selectedAccount;
    } catch (error: any) {
      console.error('Save ad account error:', error);
      throw error;
    }
  }

  async getConnectedAdAccount(userEmail: string) {
    try {
      const account = await AdAccount.findOne({
        $or: [
          { created_by: userEmail, status: 'connected' },
          { created_by_email: userEmail, status: 'connected' },
          { owner_email: userEmail, status: 'connected' },
        ]
      }).select('+access_token');

      return account;
    } catch (error) {
      console.error('Get connected ad account error:', error);
      return null;
    }
  }

  async getUserPages(accessToken: string) {
    try {
      const response = await axios.get(`${this.baseURL}/me/accounts`, {
        params: {
          access_token: accessToken,
        },
      });
      return response.data;
    } catch (error: any) {
      console.error('Facebook Pages API Error:', error.response?.data || error.message);
      throw new Error('Failed to fetch Facebook pages');
    }
  }

  async getPageInsights(pageId: string, accessToken: string) {
    try {
      const response = await axios.get(`${this.baseURL}/${pageId}/insights`, {
        params: {
          access_token: accessToken,
          metric: 'page_impressions,page_engaged_users',
          period: 'day',
        },
      });
      return response.data;
    } catch (error: any) {
      console.error('Facebook Insights API Error:', error.response?.data || error.message);
      throw new Error('Failed to fetch page insights');
    }
  }

  // Helper method to make Facebook API calls with retry logic
  private async makeApiCall(url: string, options: any = {}, retries = 3): Promise<any> {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const response = await axios.get(url, options);
        return response.data;
      } catch (error: any) {
        // Rate limit or server error - retry
        if ((error.response?.status === 429 || error.response?.status >= 500) && attempt < retries) {
          const waitTime = 1000 * attempt; // Exponential backoff
          await new Promise(resolve => setTimeout(resolve, waitTime));
          continue;
        }
        throw error;
      }
    }
  }
}

export default new FacebookService();