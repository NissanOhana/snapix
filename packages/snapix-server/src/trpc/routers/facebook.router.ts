import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { router, protectedProcedure } from '../trpc';
import facebookService from '../../services/facebook.service';

export const facebookRouter = router({
  getMe: protectedProcedure.query(async ({ ctx }) => {
    const accessToken = ctx.user.facebookTokens?.accessToken;
    
    if (!accessToken) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'No Facebook access token',
      });
    }

    try {
      const data = await facebookService.getUserData(accessToken);
      return data;
    } catch (error) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch Facebook data',
      });
    }
  }),

  getPages: protectedProcedure.query(async ({ ctx }) => {
    const accessToken = ctx.user.facebookTokens?.accessToken;
    
    if (!accessToken) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'No Facebook access token',
      });
    }

    try {
      const data = await facebookService.getUserPages(accessToken);
      return data;
    } catch (error) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch Facebook pages',
      });
    }
  }),

  getPageInsights: protectedProcedure
    .input(
      z.object({
        pageId: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      const accessToken = ctx.user.facebookTokens?.accessToken;
      
      if (!accessToken) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'No Facebook access token',
        });
      }

      try {
        const data = await facebookService.getPageInsights(input.pageId, accessToken);
        return data;
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch page insights',
        });
      }
    }),
});