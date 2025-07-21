const express = require('express');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 8001;

// Middleware
app.use(cors());
app.use(express.json());

console.log('🚀 Starting BarBuddy backend server...');

// Routes
app.get('/', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'BarBuddy API is running!',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

app.get('/api', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'BarBuddy API is running with Supabase integration',
    endpoints: {
      health: '/api',
      admin: '/api/admin',
      userProfile: '/api/user/:userId/profile',
      venueGlobalLikes: '/api/venues/likes/global'
    }
  });
});

app.get('/api/admin', (req, res) => {
  res.json({ 
    message: 'BarBuddy Admin Dashboard',
    database: 'Supabase',
    tables: [
      'user_profiles',
      'bar_likes',
      'global_bar_likes',
      'friends', 
      'friend_requests',
      'venue_interactions',
      'user_achievements',
      'user_stats',
      'night_out_sessions'
    ],
    status: 'Ready for launch! 🚀'
  });
});

app.get('/api/user/:userId/profile', (req, res) => {
  const userId = req.params.userId;
  res.json({
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

app.get('/api/venues/likes/global', (req, res) => {
  res.json([
    { venue_id: 'venue_001', venue_name: 'The Rusty Anchor', total_likes: 150 },
    { venue_id: 'venue_002', venue_name: 'Downtown Sports Bar', total_likes: 203 },
    { venue_id: 'venue_003', venue_name: 'Craft & Co.', total_likes: 89 },
    { venue_id: 'venue_004', venue_name: 'The Night Spot', total_likes: 134 }
  ]);
});

// Start server
app.listen(port, '0.0.0.0', () => {
  console.log(`✅ BarBuddy backend is running on http://0.0.0.0:${port}/`);
  console.log(`📊 Health check: http://0.0.0.0:${port}/api`);
  console.log(`🔧 Admin panel: http://0.0.0.0:${port}/api/admin`);
  console.log(`👤 User API: http://0.0.0.0:${port}/api/user/{userId}/profile`);
  console.log(`🍺 Venues API: http://0.0.0.0:${port}/api/venues/likes/global`);
  console.log(`🎯 Launch ready! Camera functionality removed, modern profile UI implemented.`);
});

module.exports = app;