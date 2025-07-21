#!/usr/bin/env node

/**
 * BarBuddy Startup Check
 * Verifies that all critical files are present and properly configured
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 BarBuddy Startup Check...\n');

const criticalFiles = [
  'app/_layout.tsx',
  'app/(tabs)/_layout.tsx', 
  'app/(tabs)/index.tsx',
  'app/index.tsx',
  'stores/userProfileStore.ts',
  'stores/authStore.ts',
  'lib/supabase.ts',
  'package.json',
  '.env'
];

let allGood = true;

// Check critical files
console.log('📁 Checking critical files...');
criticalFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} - MISSING`);
    allGood = false;
  }
});

// Check package.json scripts
console.log('\n📦 Checking package.json scripts...');
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const requiredScripts = ['start', 'android', 'ios', 'web'];
  
  requiredScripts.forEach(script => {
    if (packageJson.scripts && packageJson.scripts[script]) {
      console.log(`✅ Script: ${script}`);
    } else {
      console.log(`❌ Script: ${script} - MISSING`);
      allGood = false;
    }
  });
} catch (error) {
  console.log('❌ Error reading package.json:', error.message);
  allGood = false;
}

// Check .env configuration
console.log('\n🔧 Checking environment configuration...');
try {
  const envContent = fs.readFileSync('.env', 'utf8');
  if (envContent.includes('EXPO_PUBLIC_SUPABASE_URL=') && envContent.includes('EXPO_PUBLIC_SUPABASE_ANON_KEY=')) {
    console.log('✅ Environment variables configured (demo mode ready)');
  } else {
    console.log('⚠️  Environment variables not found, but app will work in demo mode');
  }
} catch (error) {
  console.log('⚠️  .env file not found, but app will work in demo mode');
}

// Check TypeScript configuration
console.log('\n🔧 Checking TypeScript configuration...');
if (fs.existsSync('tsconfig.json')) {
  console.log('✅ tsconfig.json found');
} else {
  console.log('❌ tsconfig.json - MISSING');
  allGood = false;
}

// Final result
console.log('\n' + '='.repeat(50));
if (allGood) {
  console.log('🎉 All checks passed! BarBuddy is ready to start.');
  console.log('\n💡 To start the app, run:');
  console.log('   npm start');
  console.log('   # or');
  console.log('   npx expo start');
  process.exit(0);
} else {
  console.log('❌ Some issues found. Please fix the missing files/configurations.');
  process.exit(1);
}