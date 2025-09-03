import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import campaignsService from '../../services/campaigns.service';

export const campaignsRouter = router({
  // Fetch campaigns with caching (main endpoint from legacy app)
  fetchCampaignsWithCache: protectedProcedure
    .input(z.object({
      forceRefresh: z.boolean().optional().default(false),
      limit: z.number().min(1).max(100).optional().default(50),
      status: z.array(z.string()).optional().default(['ACTIVE', 'PAUSED']),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      try {
        const userEmail = ctx.user.email;
        const campaigns = await campaignsService.fetchCampaignsWithCache(userEmail, {
          forceRefresh: input.forceRefresh,
          limit: input.limit,
          status: input.status,
          startDate: input.startDate,
          endDate: input.endDate,
        });

        return {
          success: true,
          data: campaigns,
          count: campaigns.length,
          cached: !input.forceRefresh,
          timestamp: new Date().toISOString(),
        };
      } catch (error: any) {
        console.error('Fetch campaigns error:', error.message);
        throw new Error(error.message);
      }
    }),

  // Get campaign summary/stats
  getCampaignSummary: protectedProcedure
    .query(async ({ ctx }) => {
      try {
        const userEmail = ctx.user.email;
        
        // Get recent campaigns data
        const campaigns = await campaignsService.fetchCampaignsWithCache(userEmail, {
          limit: 100,
          status: ['ACTIVE', 'PAUSED', 'COMPLETED'],
        });

        // Calculate summary stats
        const summary = {
          total_campaigns: campaigns.length,
          active_campaigns: campaigns.filter((c: any) => c.is_active).length,
          total_spend: campaigns.reduce((sum: number, c: any) => sum + (c.performance_metrics?.spend || 0), 0),
          total_impressions: campaigns.reduce((sum: number, c: any) => sum + (c.performance_metrics?.impressions || 0), 0),
          total_clicks: campaigns.reduce((sum: number, c: any) => sum + (c.performance_metrics?.clicks || 0), 0),
          total_conversions: campaigns.reduce((sum: number, c: any) => sum + (c.performance_metrics?.conversions || 0), 0),
          avg_ctr: 0,
          avg_cpc: 0,
          avg_roas: 0,
        };

        // Calculate averages
        const activeCampaigns = campaigns.filter((c: any) => c.performance_metrics?.impressions > 0);
        if (activeCampaigns.length > 0) {
          summary.avg_ctr = activeCampaigns.reduce((sum: number, c: any) => sum + (c.performance_metrics?.ctr || 0), 0) / activeCampaigns.length;
          summary.avg_cpc = activeCampaigns.reduce((sum: number, c: any) => sum + (c.performance_metrics?.cpc || 0), 0) / activeCampaigns.length;
          summary.avg_roas = activeCampaigns.reduce((sum: number, c: any) => sum + (c.performance_metrics?.roas || 0), 0) / activeCampaigns.length;
        }

        return {
          success: true,
          data: summary,
          timestamp: new Date().toISOString(),
        };
      } catch (error: any) {
        console.error('Get campaign summary error:', error.message);
        throw new Error(`Failed to get campaign summary: ${error.message}`);
      }
    }),

  // Get single campaign details
  getCampaignDetails: protectedProcedure
    .input(z.object({
      campaignId: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      try {
        const userEmail = ctx.user.email;
        
        // Get all campaigns and find the specific one
        const campaigns = await campaignsService.fetchCampaignsWithCache(userEmail, {
          limit: 100,
        });
        
        const campaign = campaigns.find((c: any) => c.id === input.campaignId || c.meta_campaign_id === input.campaignId);
        
        if (!campaign) {
          throw new Error('Campaign not found');
        }

        return {
          success: true,
          data: campaign,
          timestamp: new Date().toISOString(),
        };
      } catch (error: any) {
        console.error('Get campaign details error:', error.message);
        throw new Error(error.message);
      }
    }),

  // Refresh campaigns data (force refresh)
  refreshCampaigns: protectedProcedure
    .mutation(async ({ ctx }) => {
      try {
        const userEmail = ctx.user.email;
        const campaigns = await campaignsService.fetchCampaignsWithCache(userEmail, {
          forceRefresh: true,
        });

        return {
          success: true,
          message: 'Campaigns data refreshed successfully',
          count: campaigns.length,
          timestamp: new Date().toISOString(),
        };
      } catch (error: any) {
        console.error('Refresh campaigns error:', error.message);
        throw new Error(error.message);
      }
    }),
});