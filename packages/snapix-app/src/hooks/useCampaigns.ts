import { trpc } from '@/lib/trpc';
import { useState } from 'react';

export interface CampaignFilters {
  forceRefresh?: boolean;
  limit?: number;
  status?: string[];
  startDate?: string; // YYYY-MM-DD format
  endDate?: string;   // YYYY-MM-DD format
}

export const useCampaigns = (initialFilters: CampaignFilters = {}) => {
  const [filters, setFilters] = useState<CampaignFilters>(initialFilters);

  // Fetch campaigns with cache
  const {
    data: campaignsData,
    isLoading: isLoadingCampaigns,
    error: campaignsError,
    refetch: refetchCampaigns,
  } = trpc.campaigns.fetchCampaignsWithCache.useQuery(filters, {
    enabled: true, // Always try to fetch when user is authenticated
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Get campaign summary
  const {
    data: summaryData,
    isLoading: isLoadingSummary,
    error: summaryError,
  } = trpc.campaigns.getCampaignSummary.useQuery(undefined, {
    enabled: true,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Refresh campaigns mutation
  const refreshCampaignsMutation = trpc.campaigns.refreshCampaigns.useMutation();

  // Get campaign details
  const getCampaignDetails = (campaignId: string) => {
    return trpc.campaigns.getCampaignDetails.useQuery(
      { campaignId },
      {
        enabled: !!campaignId,
        staleTime: 2 * 60 * 1000, // 2 minutes
      }
    );
  };

  const updateFilters = (newFilters: Partial<CampaignFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    // Trigger refetch with new filters
    setTimeout(() => refetchCampaigns(), 100);
  };

  const refreshCampaigns = async () => {
    try {
      await refreshCampaignsMutation.mutateAsync();
      // Refetch the campaigns after refresh
      await refetchCampaigns();
    } catch (error) {
      console.error('Failed to refresh campaigns:', error);
      throw error;
    }
  };

  // Helper function to get campaigns by status
  const getCampaignsByStatus = (status: string) => {
    const campaigns = (campaignsData?.success && 'data' in campaignsData) ? campaignsData.data as any[] : [];
    return campaigns.filter((campaign: any) => 
      campaign.status.toLowerCase() === status.toLowerCase()
    );
  };

  // Helper function to get top performing campaigns
  const getTopPerformingCampaigns = (limit: number = 5) => {
    const campaigns = (campaignsData?.success && 'data' in campaignsData) ? campaignsData.data as any[] : [];
    return [...campaigns]
      .sort((a: any, b: any) => (b.performance_metrics?.roas || 0) - (a.performance_metrics?.roas || 0))
      .slice(0, limit);
  };

  return {
    // Data
    campaigns: (campaignsData?.success && 'data' in campaignsData) ? campaignsData.data : [],
    campaignsMetadata: {
      count: (campaignsData?.success && 'count' in campaignsData) ? campaignsData.count : 0,
      cached: (campaignsData?.success && 'cached' in campaignsData) ? campaignsData.cached : false,
      timestamp: campaignsData?.timestamp,
    },
    
    summary: (summaryData?.success && 'data' in summaryData) ? summaryData.data : null,
    
    // Loading states
    isLoadingCampaigns,
    isLoadingSummary,
    isRefreshing: refreshCampaignsMutation.isLoading,
    
    // Errors
    campaignsError,
    summaryError,
    refreshError: refreshCampaignsMutation.error,
    
    // Actions
    updateFilters,
    refreshCampaigns,
    refetchCampaigns,
    getCampaignDetails,
    
    // Helper functions
    getCampaignsByStatus,
    getTopPerformingCampaigns,
    
    // Current filters
    currentFilters: filters,
  };
};