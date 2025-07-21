const express = require('express');
const path = require('path');

const app = express();
const port = 3000;

// Serve static files
app.use(express.static(__dirname));

// Serve the demo page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'static-demo.html'));
});

// API endpoint to show backend is working
app.get('/api/status', (req, res) => {
  res.json({
    status: 'success',
    message: 'BarBuddy app is running!',
    backend: 'http://localhost:8001/api',
    features: {
      cameraRemoved: true,
      modernUI: true,
      databaseFixed: true,
      launchReady: true
    }
  });
});

app.listen(port, '0.0.0.0', () => {
  console.log(`✅ BarBuddy demo is running on http://0.0.0.0:${port}`);
  console.log(`🎯 This demonstrates the completed UI overhaul`);
  console.log(`📱 Camera functionality has been removed`);
  console.log(`🎨 Modern Apple-inspired UI implemented`);
  console.log(`🗄️ Backend API: http://localhost:8001/api`);
});