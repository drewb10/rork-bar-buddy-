import { router } from './create-context';
import { hiProcedure } from './routes/example/hi/route';
import { trackInteractionProcedure } from './routes/analytics/track-interaction/route';
import { getInteractionsProcedure } from './routes/analytics/get-interactions/route';
import { trackDrunkScaleProcedure } from './routes/analytics/track-drunk-scale/route';
import { createProfileProcedure } from './routes/user/create-profile/route';
import { searchUserProcedure } from './routes/user/search-user/route';
import { addFriendProcedure } from './routes/user/add-friend/route';
import { completeTaskProcedure } from './routes/bingo/complete-task/route';
import { completeBingoProcedure } from './routes/bingo/complete-bingo/route';
import { sendFriendRequestProcedure } from './routes/user/send-friend-request/route';
import { acceptFriendRequestProcedure } from './routes/user/accept-friend-request/route';
import { declineFriendRequestProcedure } from './routes/user/decline-friend-request/route';
import { getFriendRequestsProcedure } from './routes/user/get-friend-requests/route';
import { createSessionProcedure } from './routes/chat/create-session/route';
import { getMessagesProcedure } from './routes/chat/get-messages/route';
import { sendMessageProcedure } from './routes/chat/send-message/route';
import { likeMessageProcedure } from './routes/chat/like-message/route';

export const appRouter = router({
  example: router({
    hi: hiProcedure,
  }),
  analytics: router({
    trackInteraction: trackInteractionProcedure,
    getInteractions: getInteractionsProcedure,
    trackDrunkScale: trackDrunkScaleProcedure,
  }),
  user: router({
    createProfile: createProfileProcedure,
    searchUser: searchUserProcedure,
    addFriend: addFriendProcedure,
    sendFriendRequest: sendFriendRequestProcedure,
    acceptFriendRequest: acceptFriendRequestProcedure,
    declineFriendRequest: declineFriendRequestProcedure,
    getFriendRequests: getFriendRequestsProcedure,
  }),
  bingo: router({
    completeTask: completeTaskProcedure,
    completeBingo: completeBingoProcedure,
  }),
  chat: router({
    createSession: createSessionProcedure,
    getMessages: getMessagesProcedure,
    sendMessage: sendMessageProcedure,
    likeMessage: likeMessageProcedure,
  }),
});

export type AppRouter = typeof appRouter;