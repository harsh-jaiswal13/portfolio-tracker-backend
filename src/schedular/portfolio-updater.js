import { fetchStockDetails} from '../services/portfolio-service.js';
import { initCache } from '../config/cache-config.js';

let timer = null;

export function startPortfolioUpdates(intervalSeconds = 15) {
  if (timer) return;

  console.log(`stoks shedular started ${intervalSeconds}s`);

  // Run immediately on first start
  (async () => {
    try {
      initCache()
      console.log('Updating portfolio snapshot (initial run)...');
      const portfolio = await fetchStockDetails();
      console.log(portfolio);

      console.log('Portfolio snapshot sent (initial run)');
    } catch (err) {
      console.error('Portfolio update failed:', err.message);
    }
  })();

  // Then schedule updates every intervalSeconds
  timer = setInterval(async () => {
    try {
      console.log('Updating portfolio snapshot...');
      const portfolio = await fetchStockDetails();

      console.log('Stocks details updated');
    } catch (err) {
      console.error('Portfolio update failed:', err.message);
    }
  }, intervalSeconds * 1000);
}
