import { createTRPCRouter } from "./create-context";
import hiRoute from "./routes/example/hi/route";
import trackInteractionRoute from "./routes/analytics/track-interaction/route";
import getInteractionsRoute from "./routes/analytics/get-interactions/route";
import trackDrunkScaleRoute from "./routes/analytics/track-drunk-scale/route";
import createProfileRoute from "./routes/user/create-profile/route";
import searchUserRoute from "./routes/user/search-user/route";
import addFriendRoute from "./routes/user/add-friend/route";
import sendFriendRequestRoute from "./routes/user/send-friend-request/route";
import acceptFriendRequestRoute from "./routes/user/accept-friend-request/route";
import declineFriendRequestRoute from "./routes/user/decline-friend-request/route";
import getFriendRequestsRoute from "./routes/user/get-friend-requests/route";
import completeTaskRoute from "./routes/bingo/complete-task/route";
import completeBingoRoute from "./routes/bingo/complete-bingo/route";
import sendMessageRoute from "./routes/chat/send-message/route";
import getMessagesRoute from "./routes/chat/get-messages/route";

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
    sendFriendRequest: sendFriendRequestRoute,
    acceptFriendRequest: acceptFriendRequestRoute,
    declineFriendRequest: declineFriendRequestRoute,
    getFriendRequests: getFriendRequestsRoute,
  }),
  bingo: createTRPCRouter({
    completeTask: completeTaskRoute,
    completeBingo: completeBingoRoute,
  }),
  chat: createTRPCRouter({
    sendMessage: sendMessageRoute,
    getMessages: getMessagesRoute,
  }),
});

export type AppRouter = typeof appRouter;