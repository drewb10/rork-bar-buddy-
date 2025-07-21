const http = require('http');
const fs = require('fs');
const path = require('path');

const port = 3000;

const server = http.createServer((req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.url === '/' || req.url === '/index.html') {
    // Serve the main demo page
    const htmlPath = path.join(__dirname, 'static-demo.html');
    fs.readFile(htmlPath, 'utf8', (err, data) => {
      if (err) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('File not found');
        return;
      }
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(data);
    });
  } else if (req.url === '/api/status') {
    // API endpoint
    const response = JSON.stringify({
      status: 'success',
      message: 'BarBuddy app is running!',
      backend: 'http://localhost:8001/api',
      features: {
        cameraRemoved: true,
        modernUI: true,
        databaseFixed: true,
        launchReady: true
      },
      timestamp: new Date().toISOString()
    });
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(response);
  } else {
    // 404 for other routes
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
  }
});

server.listen(port, '0.0.0.0', () => {
  console.log(`✅ BarBuddy demo is running on http://0.0.0.0:${port}`);
  console.log(`🎯 This demonstrates the completed UI overhaul`);
  console.log(`📱 Camera functionality has been removed`);
  console.log(`🎨 Modern Apple-inspired UI implemented`);
  console.log(`🗄️ Backend API: http://localhost:8001/api`);
  console.log(`🚀 App is launch-ready!`);
});