import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { router, publicProcedure, protectedProcedure } from '../trpc';
import authService from '../../services/auth.service';
import User from '../../models/User';

export const authRouter = router({
  me: protectedProcedure.query(({ ctx }) => {
    return ctx.user;
  }),

  signup: publicProcedure
    .input(
      z.object({
        username: z.string().min(3).max(30).toLowerCase(),
        email: z.string().email(),
        password: z.string().min(6),
        name: z.string().min(1),
      })
    )
    .mutation(async ({ input }) => {
      const existingUser = await User.findOne({
        $or: [{ email: input.email }, { username: input.username }],
      });

      if (existingUser) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: existingUser.email === input.email 
            ? 'Email already registered' 
            : 'Username already taken',
        });
      }

      const user = await User.create({
        username: input.username,
        email: input.email,
        password: input.password,
        name: input.name,
      });

      const tokens = authService.generateTokens(user);
      await authService.saveRefreshToken((user._id as any).toString(), tokens.refreshToken);

      await User.findByIdAndUpdate(user._id, { lastLogin: new Date() });

      return {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          name: user.name,
        },
        ...tokens,
      };
    }),

  login: publicProcedure
    .input(
      z.object({
        username: z.string(),
        password: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const user = await User.findOne({
        $or: [
          { username: input.username.toLowerCase() },
          { email: input.username.toLowerCase() },
        ],
        isActive: true,
      }).select('+password');

      if (!user) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Invalid credentials',
        });
      }

      const isValidPassword = await user.comparePassword(input.password);
      
      if (!isValidPassword) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Invalid credentials',
        });
      }

      const tokens = authService.generateTokens(user);
      await authService.saveRefreshToken((user._id as any).toString(), tokens.refreshToken);

      await User.findByIdAndUpdate(user._id, { lastLogin: new Date() });

      return {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          name: user.name,
        },
        ...tokens,
      };
    }),

  refreshToken: publicProcedure
    .input(
      z.object({
        refreshToken: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const user = await authService.verifyRefreshToken(input.refreshToken);
      
      if (!user) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Invalid refresh token',
        });
      }

      const tokens = authService.generateTokens(user);
      await authService.saveRefreshToken((user._id as any).toString(), tokens.refreshToken);

      return tokens;
    }),

  logout: protectedProcedure.mutation(async ({ ctx }) => {
    await authService.revokeRefreshToken((ctx.user._id as any).toString());
    return { message: 'Logged out successfully' };
  }),
});