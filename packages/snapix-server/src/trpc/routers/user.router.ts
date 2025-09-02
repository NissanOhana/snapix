import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import User from '../../models/User';

export const userRouter = router({
  getProfile: protectedProcedure.query(async ({ ctx }) => {
    const user = await User.findById(ctx.user._id);
    return user;
  }),

  updateProfile: protectedProcedure
    .input(
      z.object({
        name: z.string().optional(),
        metadata: z.record(z.any()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const user = await User.findByIdAndUpdate(
        ctx.user._id,
        { 
          ...(input.name && { name: input.name }),
          ...(input.metadata && { metadata: input.metadata }),
        },
        { new: true }
      );
      return user;
    }),
});