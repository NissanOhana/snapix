import { createTRPCReact } from '@trpc/react-query';
import { httpBatchLink } from '@trpc/client';
import type { AppRouter } from '../../../snapix-server/src/trpc/router';

export const trpc = createTRPCReact<AppRouter>();

export const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: import.meta.env.VITE_TRPC_URL || '/api/trpc',
      headers: () => {
        const token = localStorage.getItem('accessToken');
        return token ? { authorization: `Bearer ${token}` } : {};
      },
    }),
  ],
});