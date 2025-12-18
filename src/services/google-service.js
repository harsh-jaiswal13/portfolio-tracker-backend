import { WebScraper } from './scrapper-service.js';
const scraper = new WebScraper();

/**
 * Extracts financial data from Google Finance page
 * @param {string} symbol - Stock symbol
 * @param {string} exchange - Exchange code
 * @returns {Promise<{cmp: number|null, pe: number|null, eps: number|null}>}
 */
export async function getGoogleFinance(symbol, exchange) {
  const url = `https://www.google.com/finance/quote/${symbol}:${exchange}`;
  
  const extractFn = () => {
    // All constants must be defined inside this function
    // because it runs in the browser context
    const SELECTORS = {
      rows: 'div.gyFHrc',
      label: 'div.mfs7Fc',
      value: 'div.P6K39c',
      altLabel: 'div.rsPbEe',
      price: 'div[data-last-price], div.XfM7Ld'
    };
    
    const LABELS = {
      pe: 'P/E ratio',
      eps: ['EPS', 'Earnings per share']
    };
    
    // Helper function to parse numeric values
    function parseNumeric(text, allowNegative = false) {
      if (!text) return null;
      const regex = allowNegative ? /[^0-9.-]/g : /[^0-9.]/g;
      const cleaned = text.replace(regex, '').trim();
      return cleaned ? parseFloat(cleaned) : null;
    }
    
    const data = { cmp: null, pe: null, eps: null };
    
    // Extract P/E and EPS from main rows
    const rows = document.querySelectorAll(SELECTORS.rows);
    for (const row of rows) {
      const label = row.querySelector(SELECTORS.label)?.textContent.trim();
      const value = row.querySelector(SELECTORS.value)?.textContent.trim();
      
      if (!label || !value) continue;
      
      if (label === LABELS.pe && data.pe === null) {
        data.pe = parseNumeric(value);
      } else if (LABELS.eps.includes(label) && data.eps === null) {
        data.eps = parseNumeric(value, true);
      }
      
      // Exit early if both values found
      if (data.pe !== null && data.eps !== null) break;
    }
    
    // Fallback: Search alternative EPS location (in income statement table)
    if (data.eps === null) {
      // Look for EPS in the financial table
      const tableRows = document.querySelectorAll('table.slpEwd tr.roXhBd');
      
      for (const row of tableRows) {
        const labelCell = row.querySelector('td.J9Jhg');
        if (!labelCell) continue;
        
        const labelDiv = labelCell.querySelector(SELECTORS.altLabel);
        if (!labelDiv) continue;
        
        const labelText = labelDiv.textContent.trim();
        
        if (LABELS.eps.includes(labelText)) {
          // Value is in the next td with class QXDnM
          const valueCell = row.querySelector('td.QXDnM');
          if (valueCell) {
            const valueText = valueCell.textContent.trim();
            // Skip if value is "—" (em dash, used for missing data)
            if (valueText !== '—' && valueText !== '-') {
              data.eps = parseNumeric(valueText, true);
              break;
            }
          }
        }
      }
    }
    
    // Extract current market price
    const priceEl = document.querySelector(SELECTORS.price);
    if (priceEl) {
      data.cmp = parseNumeric(priceEl.textContent);
    }
    
    return data;
  };
  
  return await scraper.fetchPage(url, extractFn);
}

/**
 * Close the browser instance
 */
export async function closeScraper() {
  await scraper.closeBrowser();
}