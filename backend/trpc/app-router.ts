import { createTRPCRouter } from "./create-context";
import hiRoute from "./routes/example/hi/route";
import trackInteractionRoute from "./routes/analytics/track-interaction/route";
import getInteractionsRoute from "./routes/analytics/get-interactions/route";
import trackDrunkScaleRoute from "./routes/analytics/track-drunk-scale/route";

export const appRouter = createTRPCRouter({
  example: createTRPCRouter({
    hi: hiRoute,
  }),
  analytics: createTRPCRouter({
    trackInteraction: trackInteractionRoute,
    getInteractions: getInteractionsRoute,
    trackDrunkScale: trackDrunkScaleRoute,
  }),
});

export type AppRouter = typeof appRouter;