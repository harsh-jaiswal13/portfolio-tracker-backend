import { callApi } from '../utils/api.helper.js';

function formatYahooSymbol(symbol, exchange) {
  if (exchange === 'NSE') return `${symbol}.NS`;
  if (exchange === 'BSE') return `${symbol}.BO`;
  throw new Error('Unsupported exchange');
}
export async function getStockFromYahoo(symbol, exchange) {
  try {
    const yahooSymbol = formatYahooSymbol(symbol, exchange);
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}`;
    const response = await callApi({
      method: 'GET',
      url,
      params: {
        interval: '1d',
        range: '1d',
      },
    });

    const result = response.chart.result[0];
    const quote = result.meta;
    const currentPrice = result.meta.regularMarketPrice;
    console.log(quote.longName || quote.shortName || symbol);

    return {
      stockName: quote.longName || quote.shortName || symbol,
      symbol: quote.symbol,
      price: currentPrice,
      currency: quote.currency,
      exchange: quote.exchangeName,
      changePercent: quote.regularMarketChangePercent || 0,
      change: quote.regularMarketPrice - quote.chartPreviousClose,
      dayHigh: quote.regularMarketDayHigh,
      dayLow: quote.regularMarketDayLow,
      previousClose: quote.chartPreviousClose,
      volume: quote.regularMarketVolume,
      timeMeta: {
        marketState: quote.marketState,
        lastUpdated: new Date(quote.regularMarketTime * 1000).toISOString(),
        timezone: quote.timezone,
      },
    };
  } catch (error) {
    console.error('Yahoo Finance API error:', error.message);
    throw new Error(`Failed to fetch stock data: ${error.message}`);
  }
}

