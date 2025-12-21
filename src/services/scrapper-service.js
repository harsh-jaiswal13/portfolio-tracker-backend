import puppeteer from 'puppeteer';

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export class WebScraper {
  constructor(options = {}) {
    this.sharedBrowser = null;
    this.activePage = null;
    this.pageInUse = false;
    
    this.minRequestInterval = options.minRequestInterval || 1500;
    this.lastRequestTime = 0;
  }

  async getBrowser() {
    if (!this.sharedBrowser || !this.sharedBrowser.isConnected()) {
      console.log('Launching browser...');
      
      // Puppeteer configuration for Render.com
      const launchOptions = {
        headless: 'new', // Must be 'new' or true for Render
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
          '--disable-dev-tools',
          '--disable-blink-features=AutomationControlled',
          '--window-size=800,600'
        ],
        defaultViewport: { width: 800, height: 600 },
        ignoreHTTPSErrors: true,
        timeout: 60000,
      };

      // Only set executablePath if explicitly provided via environment variable
      // This allows Puppeteer to use its bundled Chrome
      if (process.env.PUPPETEER_EXECUTABLE_PATH) {
        launchOptions.executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
      }
      
      this.sharedBrowser = await puppeteer.launch(launchOptions);
      console.log('Browser launched successfully');
    }
    return this.sharedBrowser;
  }

  async getOrCreatePage() {
    const browser = await this.getBrowser();

    // Wait if page is currently in use
    while (this.pageInUse) await delay(100);

    if (!this.activePage || this.activePage.isClosed()) {
      this.activePage = await browser.newPage();
      await this.activePage.setRequestInterception(true);

      // Block unnecessary resources to speed up loading
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

      await this.activePage.setUserAgent('Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
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
    if (this.activePage && !this.activePage.isClosed()) {
      await this.activePage.close();
    }
    if (this.sharedBrowser) {
      await this.sharedBrowser.close();
    }
    this.sharedBrowser = null;
    this.activePage = null;
    console.log('Browser closed');
  }
}