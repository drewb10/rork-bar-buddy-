import { createTRPCReact } from "@trpc/react-query";
import { httpLink } from "@trpc/client";
import type { AppRouter } from "@/backend/trpc/app-router";
import superjson from "superjson";

export const trpc = createTRPCReact<AppRouter>();

const getBaseUrl = () => {
  // For development, use a fallback URL
  if (process.env.EXPO_PUBLIC_RORK_API_BASE_URL) {
    return process.env.EXPO_PUBLIC_RORK_API_BASE_URL;
  }
  
  // Fallback for development - this won't work but won't crash the app
  return "http://localhost:3000";
};

export const trpcClient = trpc.createClient({
  links: [
    httpLink({
      url: `${getBaseUrl()}/api/trpc`,
      transformer: superjson,
      fetch: (url, options) => {
        // Add error handling for network requests
        return fetch(url, options).catch(() => {
          // Return a mock response to prevent crashes
          return new Response(JSON.stringify({ error: "Network unavailable" }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
          });
        });
      },
    }),
  ],
});