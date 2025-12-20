
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const chromeDir = '/tmp/puppeteer/chrome';

console.log('Checking for Chrome installation...');

try {
  // Check if chrome is already installed
  if (fs.existsSync(chromeDir)) {
    const versions = fs.readdirSync(chromeDir);
    if (versions.length > 0) {
      const chromePath = path.join(chromeDir, versions[0], 'chrome-linux64', 'chrome');
      if (fs.existsSync(chromePath)) {
        console.log('Chrome already installed at:', chromePath);
        process.exit(0);
      }
    }
  }

  // Install chrome
  console.log('Installing Chrome for Puppeteer...');
  console.log('This may take a minute...');
  
  execSync('npx puppeteer browsers install chrome', { 
    stdio: 'inherit',
    env: {
      ...process.env,
      PUPPETEER_CACHE_DIR: '/tmp/puppeteer'
    }
  });
  
  console.log('Chrome installed successfully');
  
  // Verify the installation
  if (fs.existsSync(chromeDir)) {
    const versions = fs.readdirSync(chromeDir);
    console.log('Chrome version(s) available:', versions.join(', '));
  }
  
  process.exit(0);
  
} catch (error) {
  console.error('Failed to install Chrome:', error.message);
  console.error('Stack trace:', error.stack);
  process.exit(1);
}