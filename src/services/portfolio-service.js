import { getStockFromYahoo } from './yahoo-service.js';
import { getGoogleFinance, closeScraper as closeGoogleScraper } from './google-service.js';
import { getCache } from '../config/cache-config.js';
import { readJsonFile } from '../utils/json-reader.js';

/**
 * Fetch and cache stock data from Yahoo & Google
 */
export async function fetchStockDetails(exchange = 'NSE', options = {}) {
  const { yahooChunkSize = 15, ttl = 60000, showProgress = true } = options;
  const cache = getCache();
  // We need to fetch the stock list first.
  // TODO: Maybe move this path to a config file? Hardcoding feels dirty.
  let stockData = await readJsonFile("src/data/stocks.json");
  stockData = stockData.stocks;

  if (showProgress) {
    console.log(`📊 FETCHING STOCK DATA FOR ${stockData.length} SYMBOLS`);
  }

  const startTime = Date.now();

  // STEP 1: Yahoo Finance data (parallel chunks)
  if (showProgress) console.log('📈 Fetching Yahoo Finance data...');

  // We're chunking requests to avoid hitting Yahoo's rate limits.
  // 15 seems to be a safe number for now.
  const yahooResults = [];
  const chunks = [];

  for (let i = 0; i < stockData.length; i += yahooChunkSize) {
    chunks.push(stockData.slice(i, i + yahooChunkSize));
  }

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const results = await Promise.all(chunk.map(async ({ symbol, stock, category }) => {
      try {
        if (showProgress) console.log(`Fetching ${symbol} from Yahoo Finance...`);
        const yahooData = await getStockFromYahoo(symbol, exchange);
        return { success: true, symbol, stock, category, yahooData };
      } catch (error) {
        return { success: false, symbol, stock, category, error: error.message };
      }
    }));

    yahooResults.push(...results);

    if (showProgress) {
      const completed = Math.min((i + 1) * yahooChunkSize, stockData.length);
      console.log(`  Progress: ${completed}/${stockData.length}`);
    }

    // Wait a bit between chunks so we don't get IP banned
    if (i < chunks.length - 1) {
      await new Promise(r => setTimeout(r, 300));
    }
  }

  // STEP 2: Google Finance data (sequential)
  if (showProgress) console.log('Fetching Google Finance data');

  const finalResults = [];
  for (const result of yahooResults.filter(r => r.success)) {
    let pe = null;
    let eps = null;

    try {
      const googleData = await getGoogleFinance(result.symbol, exchange);
      pe = googleData.data.pe;
      eps = googleData.data.eps;
    } catch (err) {
      console.warn(`Google Finance scrap failed for ${result.symbol}:`, err.message);
    }

    const stockDetail = {
      symbol: result.symbol,
      stockName: result.stock,
      category: result.category,
      cachedAt: new Date().toISOString(),
      ttl,
      price: result.yahooData.price,
      currency: result.yahooData.currency,
      changePercent: result.yahooData.changePercent,
      dayHigh: result.yahooData.dayHigh,
      dayLow: result.yahooData.dayLow,
      volume: result.yahooData.volume,
      pe,
      eps,
      exchange
    };

    finalResults.push(stockDetail);

    await cache.set(result.symbol, stockDetail, ttl);

    if (showProgress) {
      console.log(`Cached ${result.symbol}`);
    }
  }

  await closeGoogleScraper();

  if (showProgress) {
    console.log(`⚡ Complete in ${((Date.now() - startTime) / 1000).toFixed(2)}s`);
  }

  return finalResults;
}

export async function getUserPortfolioData(userId) {
  const cache = getCache();

  // Load user holdings file
  const filePath = `src/data/user_${userId}_holding.json`;
  const userHoldings = await readJsonFile(filePath);

  if (!userHoldings) {
    throw new Error(`User holdings file not found for user ID ${userId}`);
  }

  // Calculate total investment to compute portfolio %
  let totalInvestment = 0;
  for (const stock of userHoldings.stocks) {
    totalInvestment += stock.purchasePrice * stock.quantity;
  }
  const stocks = Array.isArray(userHoldings?.stocks) ? userHoldings.stocks : [];
  const portfolioHoldings = [];

  for (const stock of stocks) {
    const cachedData = await cache.get(stock.symbol);
    if (!cachedData) {
      console.warn(`No cached data found for ${stock.symbol}`);
      continue;
    }

    const cmp = cachedData.price != null ? parseFloat(cachedData.price.toFixed(2)) : null;
    const investment = stock.purchasePrice * stock.quantity;
    const presentValue = cmp != null ? cmp * stock.quantity : null;
    const gainLoss = presentValue != null ? presentValue - investment : null;
    // Calculate portfolio percentage if we have a total investment
    const portfolioPercent = totalInvestment ? (investment / totalInvestment) * 100 : 0;

    portfolioHoldings.push({
      particulars: cachedData.stockName || stock.symbol,
      purchasePrice: stock.purchasePrice,
      quantity: stock.quantity,
      investment: parseFloat(investment.toFixed(2)),
      portfolioPercent: parseFloat(portfolioPercent.toFixed(2)),
      exchange: cachedData.exchange || null,
      cmp,
      presentValue: presentValue != null ? parseFloat(presentValue.toFixed(2)) : null,
      gainLoss: gainLoss != null ? parseFloat(gainLoss.toFixed(2)) : null,
      peRatio: cachedData.pe || null,
      latestEarnings: cachedData.eps || null,
      symbol: stock.symbol,
      category: stock.category,
      currency: cachedData.currency || null,
      changePercent: cachedData.changePercent || null,
      dayHigh: cachedData.dayHigh || null,
      dayLow: cachedData.dayLow || null,
      volume: cachedData.volume || null,
      lastUpdated: cachedData.cachedAt || null,
      error: cachedData.error || null
    });
  }


  let totalCurrentValue = 0;
  let totalProfitLoss = 0;
  let yahooSuccess = 0;
  let peSuccess = 0;
  let epsSuccess = 0;

  // Aggregate totals for the summary
  for (const stock of portfolioHoldings) {
    totalInvestment += stock.investment || 0;
    totalCurrentValue += stock.presentValue || 0;
    totalProfitLoss += stock.gainLoss || 0;

    if (stock.cmp != null) yahooSuccess++;
    if (stock.peRatio != null) peSuccess++;
    if (stock.latestEarnings != null) epsSuccess++;
  }

  const totalProfitLossPercent = totalInvestment
    ? parseFloat(((totalProfitLoss / totalInvestment) * 100).toFixed(2))
    : 0;

  const summary = {
    totalInvestment: parseFloat(totalInvestment.toFixed(2)),
    totalCurrentValue: parseFloat(totalCurrentValue.toFixed(2)),
    totalProfitLoss: parseFloat(totalProfitLoss.toFixed(2)),
    totalProfitLossPercent,
    totalProfitLossPercent,
    totalStocks: portfolioHoldings.length,
    successfulFetches: yahooSuccess,
    failedFetches: portfolioHoldings.length - yahooSuccess,
    peRatiosFetched: peSuccess,
    epsFetched: epsSuccess,
    lastUpdated: new Date().toISOString(),
  };
  return {
    userId: userHoldings.user_id,
    name: userHoldings.name,
    summary: summary,
    stocks: portfolioHoldings
  };
}

