import { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import { initTRPC } from "@trpc/server";
import superjson from "superjson";
import { z } from "zod";

// Context creation function
export const createContext = async (opts: FetchCreateContextFnOptions) => {
  return {
    req: opts.req,
    // Supabase client is imported directly in routes as needed
  };
};

export type Context = Awaited<ReturnType<typeof createContext>>;

// Initialize tRPC
const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter({ shape }) {
    return shape;
  },
});

export const router = t.router;
export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure;

// Create a protected procedure that validates user input
export const protectedProcedure = publicProcedure.input(
  z.object({
    userId: z.string().optional(),
  }).optional()
);