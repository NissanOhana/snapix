import axios from 'axios';
import Campaign from '../models/Campaign';
import CacheEntry from '../models/CacheEntry';
import facebookService from './facebook.service';
import { optionalEnvVars } from '../env';

interface FacebookCampaign {
  id: string;
  name: string;
  status: string;
  effective_status?: string;
  objective?: string;
  daily_budget?: number;
  lifetime_budget?: number;
  created_time?: string;
  updated_time?: string;
  start_time?: string;
  stop_time?: string;
}

interface CampaignInsights {
  spend?: number;
  impressions?: number;
  clicks?: number;
  conversions?: number;
  conversion_value?: number;
  reach?: number;
  frequency?: number;
}

export class CampaignsService {
  private baseURL = `https://graph.facebook.com/${optionalEnvVars.FACEBOOK_GRAPH_VERSION}`;

  // Cache duration in minutes
  private readonly CACHE_DURATION_MINUTES = 15;

  async fetchCampaignsWithCache(
    userEmail: string,
    options: {
      forceRefresh?: boolean;
      limit?: number;
      status?: string[];
      startDate?: string;
      endDate?: string;
    } = {}
  ) {
    try {
      const {
        forceRefresh = false,
        limit = 50,
        status = ['ACTIVE', 'PAUSED'],
        startDate,
        endDate
      } = options;

      // Create cache key
      const statusStr = status.join(',');
      const dateRange = startDate && endDate ? `_${startDate}_${endDate}` : '';
      const cacheKey = `campaigns_${userEmail}${dateRange}_${statusStr}_${limit}`;

      // Check cache first (unless force refresh)
      if (!forceRefresh) {
        const cached = await this.getCachedData(cacheKey, userEmail);
        if (cached) {
          console.log('📋 Returning cached campaigns data');
          return cached;
        }
      }

      // Get connected ad account
      const adAccount = await facebookService.getConnectedAdAccount(userEmail);
      if (!adAccount || !adAccount.access_token) {
        throw new Error('No connected Facebook ad account found. Please connect your account first.');
      }

      const adAccountId = `act_${adAccount.account_id}`;

      // Fetch campaigns from Facebook API
      const campaigns = await this.fetchCampaignsFromFacebook(
        adAccountId,
        adAccount.access_token,
        { limit, status, startDate, endDate }
      );

      // Fetch insights for campaigns
      const campaignsWithInsights = await this.enrichCampaignsWithInsights(
        campaigns,
        adAccount.access_token,
        { startDate, endDate }
      );

      // Save campaigns to database
      await this.saveCampaignsToDatabase(campaignsWithInsights, userEmail, adAccount.account_id);

      // Cache the result
      await this.setCachedData(cacheKey, userEmail, campaignsWithInsights);

      console.log(`✅ Fetched ${campaignsWithInsights.length} campaigns with insights`);
      return campaignsWithInsights;

    } catch (error: any) {
      console.error('❌ Fetch campaigns error:', error.message);
      throw new Error(`Failed to fetch campaigns: ${error.message}`);
    }
  }

  private async fetchCampaignsFromFacebook(
    adAccountId: string,
    accessToken: string,
    options: { limit: number; status: string[]; startDate?: string; endDate?: string }
  ): Promise<FacebookCampaign[]> {
    try {
      const fields = [
        'id', 'name', 'status', 'effective_status', 'objective',
        'daily_budget', 'lifetime_budget', 'created_time', 'updated_time',
        'start_time', 'stop_time'
      ].join(',');

      let url = `${this.baseURL}/${adAccountId}/campaigns`;
      const params: any = {
        fields,
        limit: options.limit,
        access_token: accessToken
      };

      // Add status filter if provided
      if (options.status.length > 0) {
        params['filtering'] = JSON.stringify([{
          field: 'effective_status',
          operator: 'IN',
          value: options.status
        }]);
      }

      const response = await this.makeApiCall(url, { params });
      
      if (!response.data) {
        throw new Error('No campaigns data received from Facebook');
      }

      return response.data;
    } catch (error: any) {
      console.error('Facebook campaigns API error:', error.response?.data || error.message);
      throw new Error(`Failed to fetch campaigns from Facebook: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  private async enrichCampaignsWithInsights(
    campaigns: FacebookCampaign[],
    accessToken: string,
    options: { startDate?: string; endDate?: string }
  ) {
    const INSIGHTS_CHUNK_SIZE = 40; // Process campaigns in chunks for insights
    
    const enrichedCampaigns = [];
    
    // Process campaigns in chunks
    for (let i = 0; i < campaigns.length; i += INSIGHTS_CHUNK_SIZE) {
      const chunk = campaigns.slice(i, i + INSIGHTS_CHUNK_SIZE);
      const campaignIds = chunk.map(c => c.id);
      
      try {
        // Fetch insights for this chunk
        const insights = await this.fetchCampaignInsights(campaignIds, accessToken, options);
        
        // Map insights to campaigns
        for (const campaign of chunk) {
          const campaignInsight = insights.find((insight: any) => insight.campaign_id === campaign.id);
          
          const enrichedCampaign = this.mapCampaignData(campaign, campaignInsight);
          enrichedCampaigns.push(enrichedCampaign);
        }
        
        // Small delay between chunks to respect rate limits
        if (i + INSIGHTS_CHUNK_SIZE < campaigns.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      } catch (error) {
        console.warn(`Failed to fetch insights for campaign chunk ${i}-${i + INSIGHTS_CHUNK_SIZE}:`, error);
        
        // Add campaigns without insights
        for (const campaign of chunk) {
          const enrichedCampaign = this.mapCampaignData(campaign);
          enrichedCampaigns.push(enrichedCampaign);
        }
      }
    }
    
    return enrichedCampaigns;
  }

  private async fetchCampaignInsights(
    campaignIds: string[],
    accessToken: string,
    options: { startDate?: string; endDate?: string }
  ): Promise<any[]> {
    try {
      const fields = [
        'campaign_id', 'spend', 'impressions', 'clicks',
        'conversions', 'conversion_value', 'reach', 'frequency'
      ].join(',');

      // Build the insights URL - we'll query each campaign individually for better reliability
      const insights = [];
      
      for (const campaignId of campaignIds) {
        try {
          let url = `${this.baseURL}/${campaignId}/insights`;
          const params: any = {
            fields,
            access_token: accessToken,
            level: 'campaign'
          };

          // Add date range if provided
          if (options.startDate && options.endDate) {
            params.time_range = JSON.stringify({
              since: options.startDate,
              until: options.endDate
            });
          } else {
            params.date_preset = 'last_30d';
          }

          const response = await this.makeApiCall(url, { params });
          
          if (response.data && response.data.length > 0) {
            insights.push({ ...response.data[0], campaign_id: campaignId });
          }
        } catch (error) {
          console.warn(`Failed to fetch insights for campaign ${campaignId}:`, error);
          // Continue with next campaign
        }
      }
      
      return insights;
    } catch (error: any) {
      console.error('Campaign insights API error:', error.response?.data || error.message);
      throw new Error(`Failed to fetch campaign insights: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  private mapCampaignData(campaign: FacebookCampaign, insights?: CampaignInsights) {
    const performanceMetrics = {
      spend: Number(insights?.spend || 0),
      impressions: Number(insights?.impressions || 0),
      clicks: Number(insights?.clicks || 0),
      conversions: Number(insights?.conversions || 0),
      conversion_value: Number(insights?.conversion_value || 0),
      reach: Number(insights?.reach || 0),
      frequency: Number(insights?.frequency || 0),
      ctr: insights?.clicks && insights?.impressions ? 
           (Number(insights.clicks) / Number(insights.impressions)) * 100 : 0,
      cpc: insights?.clicks && insights?.spend ? 
           Number(insights.spend) / Number(insights.clicks) : 0,
      cpm: insights?.impressions && insights?.spend ? 
           (Number(insights.spend) / Number(insights.impressions)) * 1000 : 0,
      roas: insights?.conversion_value && insights?.spend ? 
            Number(insights.conversion_value) / Number(insights.spend) : 0,
      cpa: insights?.conversions && insights?.spend ? 
           Number(insights.spend) / Number(insights.conversions) : 0
    };

    return {
      id: campaign.id,
      meta_campaign_id: campaign.id,
      name: campaign.name,
      status: campaign.status ? campaign.status.toLowerCase() : 'unknown',
      effective_status: campaign.effective_status,
      objective: campaign.objective,
      budget: Number(campaign.daily_budget || campaign.lifetime_budget || 0) / 100, // Facebook returns cents
      budget_type: campaign.daily_budget ? 'daily' : (campaign.lifetime_budget ? 'lifetime' : 'none'),
      created_date: campaign.created_time,
      updated_date: campaign.updated_time,
      start_date: campaign.start_time || null,
      end_date: campaign.stop_time || null,
      platform: 'facebook',
      is_active: campaign.status === 'ACTIVE',
      performance_metrics: performanceMetrics
    };
  }

  private async saveCampaignsToDatabase(campaigns: any[], userEmail: string, adAccountId: string) {
    try {
      for (const campaignData of campaigns) {
        await Campaign.findOneAndUpdate(
          { meta_campaign_id: campaignData.meta_campaign_id },
          {
            ...campaignData,
            created_by: userEmail,
            ad_account_id: adAccountId
          },
          { upsert: true, new: true }
        );
      }
      
      console.log(`💾 Saved ${campaigns.length} campaigns to database`);
    } catch (error) {
      console.error('Database save error:', error);
      // Don't throw - this is not critical for the API response
    }
  }

  private async getCachedData(key: string, userEmail: string) {
    try {
      const cached = await CacheEntry.findOne({
        key,
        user_email: userEmail,
        expires_at: { $gt: new Date() }
      });
      
      if (cached) {
        return JSON.parse(cached.value);
      }
      
      return null;
    } catch (error) {
      console.warn('Cache read error:', error);
      return null;
    }
  }

  private async setCachedData(key: string, userEmail: string, data: any) {
    try {
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + this.CACHE_DURATION_MINUTES);
      
      await CacheEntry.findOneAndUpdate(
        { key, user_email: userEmail },
        {
          key,
          user_email: userEmail,
          value: JSON.stringify(data),
          expires_at: expiresAt
        },
        { upsert: true }
      );
      
      console.log(`💨 Cached data for ${this.CACHE_DURATION_MINUTES} minutes`);
    } catch (error) {
      console.warn('Cache write error:', error);
      // Don't throw - caching is not critical
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
          console.log(`⏳ API rate limit or error, retrying in ${waitTime}ms (attempt ${attempt}/${retries})`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          continue;
        }
        throw error;
      }
    }
  }
}

export default new CampaignsService();