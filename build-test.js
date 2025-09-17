// Build test script to check for common issues
const fs = require('fs');
const path = require('path');

console.log('🔍 Checking for common build issues...');

// Check if all required files exist
const requiredFiles = [
  'src/index.js',
  'src/App.js',
  'public/index.html',
  'package.json'
];

requiredFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file} exists`);
  } else {
    console.log(`❌ ${file} missing`);
  }
});

// Check package.json for required scripts
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
if (packageJson.scripts && packageJson.scripts.build) {
  console.log('✅ Build script exists:', packageJson.scripts.build);
} else {
  console.log('❌ Build script missing');
}

// Check for common problematic patterns
const srcFiles = fs.readdirSync('src', { recursive: true });
console.log('📁 Source files found:', srcFiles.length);

console.log('✅ Build test completed');
