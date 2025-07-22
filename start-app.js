#!/usr/bin/env node

/**
 * BarBuddy App Starter
 * Ensures the app starts cleanly with proper error handling
 */

const { spawn } = require('child_process');
const fs = require('fs');

console.log('🚀 Starting BarBuddy...\n');

// Check if critical files exist
const criticalFiles = [
  'app/_layout.tsx',
  'app/(tabs)/index.tsx',
  'package.json'
];

let allFilesExist = true;
criticalFiles.forEach(file => {
  if (!fs.existsSync(file)) {
    console.error(`❌ Critical file missing: ${file}`);
    allFilesExist = false;
  }
});

if (!allFilesExist) {
  console.error('❌ Cannot start app - critical files missing');
  process.exit(1);
}

// Clear any cached data that might cause issues
console.log('🧹 Clearing caches...');
try {
  if (fs.existsSync('node_modules/.cache')) {
    fs.rmSync('node_modules/.cache', { recursive: true, force: true });
  }
  if (fs.existsSync('.expo')) {
    fs.rmSync('.expo', { recursive: true, force: true });
  }
} catch (error) {
  console.warn('⚠️ Could not clear some caches:', error.message);
}

// Start the app
console.log('🎯 Starting Expo...\n');
const expo = spawn('npx', ['expo', 'start', '--clear'], {
  stdio: 'inherit',
  shell: true
});

expo.on('error', (error) => {
  console.error('❌ Failed to start Expo:', error);
  process.exit(1);
});

expo.on('close', (code) => {
  console.log(`\n📱 Expo process exited with code ${code}`);
  process.exit(code);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down...');
  expo.kill('SIGINT');
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down...');
  expo.kill('SIGTERM');
});