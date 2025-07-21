import { serve } from "@hono/node-server";
import app from "./hono";

const port = process.env.PORT || 8001;

console.log(`🚀 Starting BarBuddy backend server on port ${port}...`);

serve({
  fetch: app.fetch,
  port: Number(port),
  hostname: "0.0.0.0",
}, (info) => {
  console.log(`✅ BarBuddy backend is running on http://0.0.0.0:${info.port}/api`);
  console.log(`📊 Health check: http://0.0.0.0:${info.port}/api`);
  console.log(`🔧 Admin panel: http://0.0.0.0:${info.port}/api/admin`);
  console.log(`🗄️  tRPC endpoint: http://0.0.0.0:${info.port}/api/trpc`);
});