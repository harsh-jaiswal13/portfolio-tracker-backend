Stock Tracker

A Node.js–based service to track and analyze a portfolio of Indian stocks.
The application fetches live market data, calculates portfolio performance, and exposes REST APIs for easy integration with frontend or mobile apps.

Overview

This project tracks stocks listed on NSE/BSE, pulls current market data from Yahoo Finance and Google Finance, and maintains a cached snapshot of stock information to reduce API load.

The service automatically refreshes portfolio data at fixed intervals and provides aggregated metrics such as portfolio value, gains, and individual stock performance.

Features

Real-time stock prices from Yahoo Finance
P/E ratio and EPS from Google Finance (via scraping)
File-based caching with configurable TTL
Portfolio-level performance calculations
Automatic background updates every 60 seconds
REST APIs with CORS support
Rate limiting to avoid IP bans

Automatic cleanup of expired cache entries

Project Structure
.
├── src
│   ├── controllers
│   ├── routes
│   ├── services
│   ├── utils
│   ├── data
│   └── cache
├── stocks.json
├── main.js
├── package.json
└── README.md

Getting Started
Prerequisites

Node.js v16 or above

npm or yarn

Installation
npm install

Running the Server
npm start


The server will start at:

http://localhost:8000

API Endpoints
    Get User Portfolio
    GET /api/portfolio/:userId

Parameters

userId (path): Supported values – 1 or 2

Sample Response
{
  "userId": 1,
  "totalValue": 245000,
  "totalProfit": 18500,
  "stocks": [
    {
      "symbol": "HDFCBANK",
      "price": 1520.45,
      "changePercent": 0.85,
      "quantity": 10
    }
  ]
}

Error Response
{
  "error": "User not found"
}

Configuration
CORS

Update allowed origins in main.js:

const allowedOrigins = ['http://localhost:3000'];

Cache Configuration

Location: stocks/

Default TTL: 60 seconds

Cleanup Interval: 30 seconds

Strategy: File-based caching using MD5 hashed keys

Cache Methods

get(key) – Fetch cached value (checks expiration)

set(key, value, ttl) – Store value with TTL

delete(key) – Remove cache entry

clear() – Clear all cached data

Data Flow
Portfolio Update (Every 60 Seconds)

portfolio-updater.js triggers stock updates

Stock symbols are loaded from stocks.json

Yahoo Finance data is fetched in batches of 15

Google Finance is scraped for P/E ratio and EPS

Results are cached for quick API responses

API Request Flow

Request hits stock-routes.js

Controller calls getUserPortfolioData()

User holdings are loaded from JSON files

Cached stock data is retrieved

Portfolio metrics are calculated and returned

Data Sources
Yahoo Finance

Endpoint:
https://query1.finance.yahoo.com/v8/finance/chart/{symbol}

Data: Price, volume, day high/low, change %

Rate Limit: 15 symbols per batch with delays

Google Finance

Method: Puppeteer scraping

Data: P/E ratio, EPS

Rate Limit: Minimum 1.5 seconds between requests

Dependencies
Package	Purpose
express	Web server
axios	HTTP requests
cors	Cross-origin support
puppeteer	Web scraping
cheerio	HTML parsing
node-cache	In-memory caching
Cleanup & Shutdown

The application handles graceful shutdown using SIGINT, ensuring background tasks and cache cleanup complete safely before exit.

Supported Stocks

Financial:
HDFCBANK, BAJFINANCE, ICICIBANK, BAJAJHFL, SBILIFE

Technology:
AFFLE, LTIM, KPITTECH, TATATECH, BLSE, TANLA

Consumer:
DMART, TATACONSUM, PIDILITIND

Power & Energy:
TATAPOWER, KPIGREEN, SUZLON, GENSOL

Pipes:
HARIOMPIPE, ASTRAL, POLYCAB

Others:
CLEAN, DEEPAKNTR, FINEORG, GRAVITA

Troubleshooting

Cache not initialized

Ensure initCache() is called before accessing cache

Stock data is null

Verify symbols exist in stocks.json

Check Yahoo Finance availability

Review request delay settings

Google Finance scraping fails

Website may block headless browser

Adjust Puppeteer launch options

Increase request delay

CORS issues

Add frontend URL to allowed origins in main.js

 Performance

Initial load: ~45–60 seconds

Scheduled updates: ~50–65 seconds

Cached API response: < 100ms

Memory usage: ~50–100 MB

Planned Improvements

WebSocket support for live updates

Database integration (MongoDB/PostgreSQL)

Advanced portfolio analytics

Email alerts for price triggers

API versioning

Authentication & authorization

Historical price tracking

License

ISC

Author

Harsh
Stock Tracker Project