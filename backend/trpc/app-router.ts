import { router } from './create-context';
import { hiProcedure } from './routes/example/hi/route';
import createSessionProcedure from './routes/chat/create-session/route';
import sendMessageProcedure from './routes/chat/send-message/route';
import getMessagesProcedure from './routes/chat/get-messages/route';

// Import user profile routes
import { getUserProfileProcedure, updateUserProfileProcedure, awardXPProcedure } from './routes/user/profile/route';

// Import venue likes routes
import { toggleVenueLikeProcedure, getUserLikedVenuesProcedure, getGlobalVenueLikesProcedure, getVenueLikeCountProcedure } from './routes/venue/likes/route';

// Import analytics routes
import { getUserStatsProcedure, getLeaderboardProcedure, recordVenueInteractionProcedure } from './routes/analytics/stats/route';

export const appRouter = router({
  example: router({
    hi: hiProcedure,
  }),
  chat: router({
    createSession: createSessionProcedure,
    sendMessage: sendMessageProcedure,
    getMessages: getMessagesProcedure,
  }),
  user: router({
    getProfile: getUserProfileProcedure,
    updateProfile: updateUserProfileProcedure,
    awardXP: awardXPProcedure,
  }),
  venue: router({
    toggleLike: toggleVenueLikeProcedure,
    getUserLikes: getUserLikedVenuesProcedure,
    getGlobalLikes: getGlobalVenueLikesProcedure,
    getLikeCount: getVenueLikeCountProcedure,
  }),
  analytics: router({
    getUserStats: getUserStatsProcedure,
    getLeaderboard: getLeaderboardProcedure,
    recordInteraction: recordVenueInteractionProcedure,
  }),
});

export type AppRouter = typeof appRouter;