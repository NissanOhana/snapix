import axios from 'axios';

export class FacebookService {
  private baseURL = `https://graph.facebook.com/${process.env.FACEBOOK_GRAPH_VERSION}`;

  async getUserData(accessToken: string) {
    try {
      const response = await axios.get(`${this.baseURL}/me`, {
        params: {
          fields: 'id,name,picture.type(large)',
          access_token: accessToken,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Facebook API Error:', error);
      throw new Error('Failed to fetch Facebook user data');
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
    } catch (error) {
      console.error('Facebook Pages API Error:', error);
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
    } catch (error) {
      console.error('Facebook Insights API Error:', error);
      throw new Error('Failed to fetch page insights');
    }
  }
}

export default new FacebookService();