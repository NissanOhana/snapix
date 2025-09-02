import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      cacheTime: 1000 * 60 * 10, // 10 minutes (gcTime in v5, cacheTime in v4)
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});