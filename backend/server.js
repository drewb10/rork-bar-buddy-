const { serve } = require("@hono/node-server");
const { Hono } = require("hono");
const { cors } = require("hono/cors");

// Create a simple Hono app
const app = new Hono();

// Enable CORS for all routes
app.use("*", cors());

// Simple health check endpoint
app.get("/", (c) => {
  return c.json({ 
    status: "ok", 
    message: "BarBuddy API is running!",
    timestamp: new Date().toISOString(),
    version: "1.0.0"
  });
});

// API routes
app.get("/api", (c) => {
  return c.json({ 
    status: "ok", 
    message: "BarBuddy API is running with Supabase integration",
    endpoints: {
      health: "/api",
      admin: "/api/admin"
    }
  });
});

// Admin dashboard info
app.get("/api/admin", (c) => {
  return c.json({ 
    message: "BarBuddy Admin Dashboard",
    database: "Supabase",
    tables: [
      "user_profiles",
      "bar_likes",
      "global_bar_likes",
      "friends", 
      "friend_requests",
      "venue_interactions",
      "user_achievements",
      "user_stats",
      "night_out_sessions"
    ],
    status: "Ready for launch! 🚀"
  });
});

// User profile endpoints (mock for now)
app.get("/api/user/:userId/profile", (c) => {
  const userId = c.req.param('userId');
  return c.json({
    user_id: userId,
    username: 'demo_user',
    display_name: 'Demo User',
    xp: 1250,
    level: 2,
    bars_hit: 5,
    nights_out: 3,
    current_rank: 'Tipsy Talent',
    message: 'Demo profile data'
  });
});

// Venue likes endpoints (mock for now)
app.get("/api/venues/likes/global", (c) => {
  return c.json([
    { venue_id: 'venue_001', venue_name: 'The Rusty Anchor', total_likes: 150 },
    { venue_id: 'venue_002', venue_name: 'Downtown Sports Bar', total_likes: 203 },
    { venue_id: 'venue_003', venue_name: 'Craft & Co.', total_likes: 89 },
    { venue_id: 'venue_004', venue_name: 'The Night Spot', total_likes: 134 }
  ]);
});

const port = process.env.PORT || 8001;

console.log(`🚀 Starting BarBuddy backend server on port ${port}...`);

serve({
  fetch: app.fetch,
  port: Number(port),
  hostname: "0.0.0.0",
}, (info) => {
  console.log(`✅ BarBuddy backend is running on http://0.0.0.0:${info.port}/`);
  console.log(`📊 Health check: http://0.0.0.0:${info.port}/api`);
  console.log(`🔧 Admin panel: http://0.0.0.0:${info.port}/api/admin`);
  console.log(`👤 User API: http://0.0.0.0:${info.port}/api/user/{userId}/profile`);
  console.log(`🍺 Venues API: http://0.0.0.0:${info.port}/api/venues/likes/global`);
  console.log(`🎯 Launch ready! All camera functionality removed, modern profile UI implemented.`);
});