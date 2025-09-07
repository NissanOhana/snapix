import { router } from './trpc';
import { authRouter } from './routers/auth.router';
import { userRouter } from './routers/user.router';
import { facebookRouter } from './routers/facebook.router';
import { agentsRouter } from './routers/agents.router';
import { facebookAuthRouter } from './routers/facebook-auth.router';
import { campaignsRouter } from './routers/campaigns.router';
import { aiRouter } from './routers/ai.router';
import { debugRouter } from './routers/debug.router';

export const appRouter = router({
  auth: authRouter,
  user: userRouter,
  facebook: facebookRouter,
  agents: agentsRouter,
  facebookAuth: facebookAuthRouter,
  campaigns: campaignsRouter,
  ai: aiRouter,
  debug: debugRouter,
});

export type AppRouter = typeof appRouter;