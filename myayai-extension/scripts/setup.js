#!/usr/bin/env node

/**
 * Setup Script for MyAyAI Extension Build System
 * Helps developers get started quickly
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log(`
🚀 MyAyAI Extension Build System Setup
=====================================

This script will help you set up the development environment.
`);

const projectRoot = path.resolve(__dirname, '..');

// Check Node.js version
const nodeVersion = process.version;
const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
if (majorVersion < 16) {
  console.error(`❌ Node.js 16+ required. You have ${nodeVersion}`);
  process.exit(1);
}
console.log(`✅ Node.js ${nodeVersion} - OK`);

// Check if package-lock.json exists
const hasPackageLock = fs.existsSync(path.join(projectRoot, 'package-lock.json'));
console.log(`📦 Package manager: ${hasPackageLock ? 'npm' : 'npm (no lock file)'}`);

// Install dependencies if node_modules doesn't exist
const nodeModulesPath = path.join(projectRoot, 'node_modules');
if (!fs.existsSync(nodeModulesPath)) {
  console.log('\n📥 Installing dependencies...');
  try {
    execSync('npm install', { 
      cwd: projectRoot, 
      stdio: 'inherit' 
    });
    console.log('✅ Dependencies installed successfully');
  } catch (error) {
    console.error('❌ Failed to install dependencies');
    process.exit(1);
  }
} else {
  console.log('✅ Dependencies already installed');
}

// Check build directories
const buildDir = path.join(projectRoot, 'build');
const scriptsDir = path.join(projectRoot, 'scripts');
const utilsDir = path.join(projectRoot, 'utils');

console.log('\n🔧 Build system components:');
console.log(`   • webpack.config.js: ${fs.existsSync(path.join(buildDir, 'webpack.config.js')) ? '✅' : '❌'}`);
console.log(`   • manifest-transformer.js: ${fs.existsSync(path.join(buildDir, 'manifest-transformer.js')) ? '✅' : '❌'}`);
console.log(`   • build-all.js: ${fs.existsSync(path.join(scriptsDir, 'build-all.js')) ? '✅' : '❌'}`);
console.log(`   • pack-extension.js: ${fs.existsSync(path.join(scriptsDir, 'pack-extension.js')) ? '✅' : '❌'}`);
console.log(`   • browser-polyfill.js: ${fs.existsSync(path.join(utilsDir, 'browser-polyfill.js')) ? '✅' : '❌'}`);

// Check manifest templates
console.log('\n📄 Manifest templates:');
console.log(`   • manifest_v2.json (Firefox): ${fs.existsSync(path.join(projectRoot, 'manifest_v2.json')) ? '✅' : '❌'}`);
console.log(`   • manifest_v3.json (Chrome): ${fs.existsSync(path.join(projectRoot, 'manifest_v3.json')) ? '✅' : '❌'}`);

console.log(`
🎯 Quick Commands
================

Development:
  npm run dev              # Watch mode for development
  npm run dev:hot          # Hot reload development server

Building:
  npm run build:all        # Build for all browsers
  npm run build:chrome     # Build for Chrome only
  npm run build:firefox    # Build for Firefox only

Packaging:
  npm run pack:all         # Build and package everything
  npm run pack:chrome      # Package Chrome version
  npm run pack:firefox     # Package Firefox version

Quality:
  npm run lint             # Check code style  
  npm run test             # Run tests
  npm run size-check       # Check bundle sizes

🏃‍♂️ Try it now:
  npm run build:all && npm run pack:all

📚 For detailed documentation, see BUILD.md
`);

// Offer to run initial build
const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('\n🚀 Would you like to run an initial build now? (y/N): ', (answer) => {
  if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
    console.log('\n⚡ Running initial build...');
    try {
      execSync('npm run build:all', { 
        cwd: projectRoot, 
        stdio: 'inherit' 
      });
      console.log('\n🎉 Initial build completed successfully!');
      console.log('📁 Check the dist/ directory for your built extensions.');
    } catch (error) {
      console.error('\n❌ Build failed. Check the error messages above.');
    }
  } else {
    console.log('\n👍 Setup complete! Run `npm run build:all` when ready.');
  }
  rl.close();
});
