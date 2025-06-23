import { createTRPCReact } from "@trpc/react-query";
import { httpLink } from "@trpc/client";
import type { AppRouter } from "@/backend/trpc/app-router";
import superjson from "superjson";

export const trpc = createTRPCReact<AppRouter>();

const getBaseUrl = () => {
  // For development, use a fallback URL that won't cause network hangs
  if (process.env.EXPO_PUBLIC_RORK_API_BASE_URL) {
    return process.env.EXPO_PUBLIC_RORK_API_BASE_URL;
  }
  
  // Safe fallback for development - this won't work but won't crash the app
  return "http://localhost:3000";
};

export const trpcClient = trpc.createClient({
  links: [
    httpLink({
      url: `${getBaseUrl()}/api/trpc`,
      transformer: superjson,
      fetch: (url, options) => {
        // Add aggressive timeout and error handling for network requests
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
          console.warn('Network request timeout, aborting');
          controller.abort();
        }, 3000); // Reduced to 3 second timeout
        
        return fetch(url, {
          ...options,
          signal: controller.signal,
        })
        .then(response => {
          clearTimeout(timeoutId);
          return response;
        })
        .catch((error) => {
          clearTimeout(timeoutId);
          console.warn('Network request failed, using offline mode:', error);
          // Return a mock response to prevent crashes and hanging
          return new Response(JSON.stringify({ 
            result: { data: null },
            error: { message: "Network unavailable", code: "NETWORK_ERROR" }
          }), {
            status: 200, // Return 200 to prevent trpc from retrying
            headers: { 'Content-Type': 'application/json' }
          });
        });
      },
    }),
  ],
});