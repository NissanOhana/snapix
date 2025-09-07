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
        startDate: rawStartDate,
        endDate: rawEndDate
      } = options;

      // Clean up empty date strings
      const startDate = rawStartDate && rawStartDate.trim() !== '' ? rawStartDate : undefined;
      const endDate = rawEndDate && rawEndDate.trim() !== '' ? rawEndDate : undefined;

      console.log(`🚀 [CAMPAIGNS] fetchCampaignsWithCache called for ${userEmail}`);
      console.log(`🔧 [CAMPAIGNS] Options:`, {
        forceRefresh,
        limit,
        status,
        startDate: startDate || 'none',
        endDate: endDate || 'none'
      });

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
      console.log(`🔍 [CAMPAIGNS] Ad Account lookup result:`, {
        found: !!adAccount,
        account_id: adAccount?.account_id,
        hasToken: !!adAccount?.access_token,
        tokenPreview: adAccount?.access_token ? adAccount.access_token.substring(0, 20) + '...' : 'none'
      });
      
      if (!adAccount || !adAccount.access_token) {
        // No Facebook account connected - fallback to database campaigns
        console.log('⚠️ [CAMPAIGNS] No Facebook account connected, returning campaigns from database');
        const dbCampaigns = await this.getCampaignsFromDatabase(userEmail, { limit, status });
        
        // Cache the database result
        await this.setCachedData(cacheKey, userEmail, dbCampaigns);
        
        console.log(`📋 [CAMPAIGNS] Returned ${dbCampaigns.length} campaigns from database`);
        return dbCampaigns;
      }

      const adAccountId = adAccount.account_id;
      console.log(`📊 [CAMPAIGNS] Raw account_id from database:`, adAccountId);
      
      // Ensure account ID has proper format (remove act_ if present, then add it)
      const cleanAccountId = adAccountId.startsWith('act_') ? adAccountId.substring(4) : adAccountId;
      console.log(`📊 [CAMPAIGNS] Clean account_id:`, cleanAccountId);
      console.log(`📊 [CAMPAIGNS] Using Facebook API with account: act_${cleanAccountId}`);

      try {
        // Fetch campaigns from Facebook API
        console.log(`📡 [CAMPAIGNS] Fetching campaigns from Facebook API...`);
        const campaigns = await this.fetchCampaignsFromFacebook(
          cleanAccountId,
          adAccount.access_token,
          { limit, status, startDate, endDate }
        );
        console.log(`📋 [CAMPAIGNS] Raw campaigns from Facebook:`, campaigns.length);

        // Fetch insights for campaigns
        console.log(`💰 [CAMPAIGNS] Enriching campaigns with insights...`);
        const campaignsWithInsights = await this.enrichCampaignsWithInsights(
          campaigns,
          adAccount.access_token,
          { startDate, endDate }
        );
        console.log(`📈 [CAMPAIGNS] Campaigns enriched with insights:`, campaignsWithInsights.length);

        // Save campaigns to database
        console.log(`💾 [CAMPAIGNS] Saving campaigns to database...`);
        await this.saveCampaignsToDatabase(campaignsWithInsights, userEmail, cleanAccountId);

        // Cache the result
        await this.setCachedData(cacheKey, userEmail, campaignsWithInsights);

        console.log(`✅ [CAMPAIGNS] Final result: ${campaignsWithInsights.length} campaigns with insights from Facebook`);
        
        // Log sample campaign for debugging
        if (campaignsWithInsights.length > 0) {
          console.log(`📊 [CAMPAIGNS] Sample campaign:`, JSON.stringify(campaignsWithInsights[0], null, 2));
        }
        
        return campaignsWithInsights;
      } catch (facebookError: any) {
        // Facebook API failed - fallback to database
        console.warn('⚠️ Facebook API failed, falling back to database:', facebookError.message);
        const dbCampaigns = await this.getCampaignsFromDatabase(userEmail, { limit, status });
        
        // Cache the database result
        await this.setCachedData(cacheKey, userEmail, dbCampaigns);
        
        console.log(`📋 Returned ${dbCampaigns.length} campaigns from database (Facebook API fallback)`);
        return dbCampaigns;
      }

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

      let url = `${this.baseURL}/act_${adAccountId}/campaigns`;
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

      // Add time range filter for campaign creation/update
      if (options.startDate && options.endDate) {
        const existingFiltering = params['filtering'] ? JSON.parse(params['filtering']) : [];
        existingFiltering.push({
          field: 'updated_time',
          operator: 'GREATER_THAN',
          value: options.startDate
        });
        existingFiltering.push({
          field: 'updated_time', 
          operator: 'LESS_THAN',
          value: options.endDate
        });
        params['filtering'] = JSON.stringify(existingFiltering);
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

      console.log(`💰 [INSIGHTS] Fetching insights for ${campaignIds.length} campaigns`);
      console.log(`🔧 [INSIGHTS] Date options:`, options);

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
            console.log(`📅 [INSIGHTS] Using custom date range for ${campaignId}: ${options.startDate} to ${options.endDate}`);
          } else {
            params.date_preset = 'last_30d';
            console.log(`📅 [INSIGHTS] Using last_30d preset for ${campaignId}`);
          }

          console.log(`📡 [INSIGHTS] API call for ${campaignId}: ${url}`);
          console.log(`🔧 [INSIGHTS] Params:`, JSON.stringify(params, null, 2));

          const response = await this.makeApiCall(url, { params });
          
          console.log(`📊 [INSIGHTS] Response for ${campaignId}:`, JSON.stringify(response, null, 2));
          
          if (response.data && response.data.length > 0) {
            const insight = { ...response.data[0], campaign_id: campaignId };
            insights.push(insight);
            console.log(`✅ [INSIGHTS] Added insight for ${campaignId}:`, insight);
          } else {
            console.log(`⚠️ [INSIGHTS] No insights data for ${campaignId}`);
          }
        } catch (error) {
          console.warn(`❌ [INSIGHTS] Failed to fetch insights for campaign ${campaignId}:`, error);
          // Continue with next campaign
        }
      }
      
      console.log(`✅ [INSIGHTS] Total insights fetched: ${insights.length} out of ${campaignIds.length} campaigns`);
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

  private async getCampaignsFromDatabase(
    userEmail: string, 
    options: { limit?: number; status?: string[] }
  ) {
    try {
      const { limit = 50, status = ['ACTIVE', 'PAUSED'] } = options;
      
      // Build filter query
      const filter: any = { created_by: userEmail };
      
      // Add status filter if provided
      if (status.length > 0) {
        // Convert status to lowercase for database comparison
        const statusLower = status.map(s => s.toLowerCase());
        filter.status = { $in: statusLower };
      }
      
      // Fetch campaigns from database
      const campaigns = await Campaign.find(filter)
        .sort({ updated_date: -1, created_date: -1 })
        .limit(limit)
        .lean();
      
      console.log(`📋 Found ${campaigns.length} campaigns in database for ${userEmail}`);
      
      // Transform database campaigns to match expected format
      return campaigns.map((campaign: any) => ({
        id: campaign.meta_campaign_id || campaign.id,
        meta_campaign_id: campaign.meta_campaign_id || campaign.id,
        name: campaign.name || 'Untitled Campaign',
        status: campaign.status || 'unknown',
        effective_status: campaign.effective_status || campaign.status?.toUpperCase(),
        objective: campaign.objective || 'UNKNOWN',
        budget: campaign.budget || 0,
        budget_type: campaign.budget_type || 'unknown',
        created_date: campaign.created_date,
        updated_date: campaign.updated_date,
        start_date: campaign.start_date,
        end_date: campaign.end_date,
        platform: campaign.platform || 'facebook',
        is_active: campaign.is_active !== undefined ? campaign.is_active : (campaign.status === 'active'),
        performance_metrics: campaign.performance_metrics || {
          spend: 0,
          impressions: 0,
          clicks: 0,
          conversions: 0,
          conversion_value: 0,
          reach: 0,
          frequency: 0,
          ctr: 0,
          cpc: 0,
          cpm: 0,
          roas: 0,
          cpa: 0
        }
      }));
      
    } catch (error) {
      console.error('Database campaigns fetch error:', error);
      // Return empty array instead of throwing to avoid breaking the API
      return [];
    }
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