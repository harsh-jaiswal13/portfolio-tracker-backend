// services/web-scraper.js
import puppeteer from 'puppeteer';

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export class WebScraper {
  constructor(options = {}) {
    this.sharedBrowser = null;
    this.activePage = null;
    this.pageInUse = false;
    
    this.minRequestInterval = options.minRequestInterval || 1500; // 1.5s
    this.lastRequestTime = 0;
  }

  async getBrowser() {
    if (!this.sharedBrowser || !this.sharedBrowser.isConnected()) {
      console.log(' Launching browser...');
      
      // Find Chrome in /tmp/puppeteer directory
      const fs = require('fs');
      const path = require('path');
      
      let executablePath;
      
      try {
        // Look for Chrome in the expected location
        const chromeBaseDir = '/tmp/puppeteer/chrome';
        const versions = fs.readdirSync(chromeBaseDir);
        
        if (versions.length > 0) {
          // Get the first (and likely only) version directory
          const versionDir = versions[0];
          executablePath = path.join(chromeBaseDir, versionDir, 'chrome-linux64', 'chrome');
          
          console.log('Found Chrome at:', executablePath);
          
          // Verify it exists
          if (!fs.existsSync(executablePath)) {
            throw new Error(`Chrome executable not found at ${executablePath}`);
          }
        } else {
          throw new Error('No Chrome version found in /tmp/puppeteer/chrome');
        }
      } catch (error) {
        console.error('Error finding Chrome:', error.message);
        console.log('Falling back to puppeteer.executablePath()');
        executablePath = puppeteer.executablePath();
      }
      
      this.sharedBrowser = await puppeteer.launch({
        headless: 'new',
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--disable-software-rasterizer',
          '--disable-extensions',
          '--disable-background-networking',
          '--disable-default-apps',
          '--disable-sync',
          '--disable-translate',
          '--hide-scrollbars',
          '--metrics-recording-only',
          '--mute-audio',
          '--no-first-run',
          '--no-zygote',
          '--single-process',
          '--window-size=800,600'
        ],
        executablePath,
        defaultViewport: { width: 800, height: 600 },
        ignoreHTTPSErrors: true,
        timeout: 60000,
      });
      
      console.log(' Browser launched successfully');
    }
    return this.sharedBrowser;
  }

  async getOrCreatePage() {
    const browser = await this.getBrowser();

    while (this.pageInUse) await delay(100);

    if (!this.activePage || this.activePage.isClosed()) {
      this.activePage = await browser.newPage();
      await this.activePage.setRequestInterception(true);

      this.activePage.on('request', (req) => {
        const type = req.resourceType();
        const url = req.url();
        if (['image', 'stylesheet', 'font', 'media', 'websocket', 'manifest', 'other'].includes(type)
            || url.includes('analytics') || url.includes('doubleclick')) {
          req.abort();
        } else {
          req.continue();
        }
      });

      await this.activePage.setUserAgent('Mozilla/5.0 (X11; Linux x86_64)');
      await this.activePage.setJavaScriptEnabled(true);
    }

    this.pageInUse = true;
    return this.activePage;
  }

  releasePage() {
    this.pageInUse = false;
  }

  async enforceRateLimit() {
    const now = Date.now();
    const elapsed = now - this.lastRequestTime;
    if (elapsed < this.minRequestInterval) {
      await delay(this.minRequestInterval - elapsed);
    }
    this.lastRequestTime = Date.now();
  }

  async fetchPage(url, extractFn) {
    await this.enforceRateLimit();
    const page = await this.getOrCreatePage();

    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
      const data = await page.evaluate(extractFn);
      return { data, cached: false };
    } catch (err) {
      console.error(`Failed to fetch ${url}:`, err.message);
      return { data: null, cached: false, error: err.message };
    } finally {
      this.releasePage();
    }
  }

  async closeBrowser() {
    if (this.activePage && !this.activePage.isClosed()) await this.activePage.close();
    if (this.sharedBrowser) await this.sharedBrowser.close();
    this.sharedBrowser = null;
    this.activePage = null;
    console.log('🧹 Browser closed');
  }
}
