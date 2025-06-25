import { router } from './create-context';
import { hiProcedure } from './routes/example/hi/route';
import createSessionProcedure from './routes/chat/create-session/route';
import sendMessageProcedure from './routes/chat/send-message/route';
import getMessagesProcedure from './routes/chat/get-messages/route';

export const appRouter = router({
  example: router({
    hi: hiProcedure,
  }),
  chat: router({
    createSession: createSessionProcedure,
    sendMessage: sendMessageProcedure,
    getMessages: getMessagesProcedure,
  }),
});

export type AppRouter = typeof appRouter;