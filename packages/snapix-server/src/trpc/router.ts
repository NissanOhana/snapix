import { router } from './trpc';
import { authRouter } from './routers/auth.router';
import { userRouter } from './routers/user.router';
import { facebookRouter } from './routers/facebook.router';
import { agentsRouter } from './routers/agents.router';

export const appRouter = router({
  auth: authRouter,
  user: userRouter,
  facebook: facebookRouter,
  agents: agentsRouter,
});

export type AppRouter = typeof appRouter;