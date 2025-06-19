import { createTRPCRouter } from "./create-context";
import hiRoute from "./routes/example/hi/route";
import trackInteractionRoute from "./routes/analytics/track-interaction/route";
import getInteractionsRoute from "./routes/analytics/get-interactions/route";
import trackDrunkScaleRoute from "./routes/analytics/track-drunk-scale/route";
import createProfileRoute from "./routes/user/create-profile/route";
import searchUserRoute from "./routes/user/search-user/route";
import addFriendRoute from "./routes/user/add-friend/route";
import completeTaskRoute from "./routes/bingo/complete-task/route";
import completeBingoRoute from "./routes/bingo/complete-bingo/route";

export const appRouter = createTRPCRouter({
  example: createTRPCRouter({
    hi: hiRoute,
  }),
  analytics: createTRPCRouter({
    trackInteraction: trackInteractionRoute,
    getInteractions: getInteractionsRoute,
    trackDrunkScale: trackDrunkScaleRoute,
  }),
  user: createTRPCRouter({
    createProfile: createProfileRoute,
    searchUser: searchUserRoute,
    addFriend: addFriendRoute,
  }),
  bingo: createTRPCRouter({
    completeTask: completeTaskRoute,
    completeBingo: completeBingoRoute,
  }),
});

export type AppRouter = typeof appRouter;