import { Hono } from "hono";
import { trpcServer } from "@hono/trpc-server";
import { cors } from "hono/cors";
import { appRouter } from "./trpc/app-router";
import { createContext } from "./trpc/create-context";

// app will be mounted at /api
const app = new Hono();

// Enable CORS for all routes
app.use("*", cors());

// Mount tRPC router at /trpc
app.use(
  "/trpc/*",
  trpcServer({
    endpoint: "/api/trpc",
    router: appRouter,
    createContext,
  })
);

// Simple health check endpoint
app.get("/", (c) => {
  return c.json({ status: "ok", message: "API is running with Supabase integration" });
});

// Supabase admin dashboard info
app.get("/admin", (c) => {
  return c.json({ 
    message: "Supabase Admin Dashboard",
    dashboard_url: "https://supabase.com/dashboard/project/your-project-id",
    tables: [
      "user_profiles",
      "friends", 
      "bingo_completions",
      "venue_interactions",
      "bingo_card_completions"
    ],
    note: "Replace 'your-project-id' with your actual Supabase project ID"
  });
});

export default app;