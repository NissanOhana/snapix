import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { router, protectedProcedure } from '../trpc';
import n8nService from '../../services/n8n.service';

export const agentsRouter = router({
  triggerWorkflow: protectedProcedure
    .input(
      z.object({
        workflowId: z.string(),
        data: z.record(z.any()),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const result = await n8nService.triggerWorkflow(input.workflowId, {
          ...input.data,
          userId: ctx.user._id,
          userEmail: ctx.user.email,
        });
        return result;
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to trigger workflow',
        });
      }
    }),
});