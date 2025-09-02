import { trpc } from '@/lib/trpc';
import { useUserStore } from '@/stores/userStore';
import { useAuth } from '@/hooks/useAuth';
import { useState } from 'react';

export const useFacebookData = () => {
  const { user } = useAuth();
  const { setFacebookData } = useUserStore();
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null);
  
  const isGuest = user?.isGuest || false;

  // Skip queries for guest users
  const { data: fbUser, isLoading: isLoadingUser } = trpc.facebook.getMe.useQuery(undefined, {
    enabled: !isGuest,
    retry: false,
  });

  const { data: pages, isLoading: isLoadingPages } = trpc.facebook.getPages.useQuery(undefined, {
    enabled: !isGuest,
    retry: false,
  });

  const { data: insights, isLoading: isLoadingInsights } = trpc.facebook.getPageInsights.useQuery(
    { pageId: selectedPageId! },
    {
      enabled: !!selectedPageId && !isGuest,
      retry: false,
      onSuccess: (data: any) => {
        setFacebookData({ insights: data });
      },
    }
  );

  return {
    fbUser: isGuest ? null : fbUser,
    pages: isGuest ? null : pages,
    insights: isGuest ? null : insights,
    isLoadingUser: isGuest ? false : isLoadingUser,
    isLoadingPages: isGuest ? false : isLoadingPages,
    getPageInsights: (pageId: string) => setSelectedPageId(pageId),
    isGettingInsights: isGuest ? false : isLoadingInsights,
  };
};