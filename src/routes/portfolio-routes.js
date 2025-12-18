// routes/portfolio.routes.js
import express from 'express';
// import { calculatePortfolio, getPortfolioByCategory } from '../services/portfolio-service.js';
// import { getLastPortfolioData } from '../websockets/portfolio-ws.js';

const router = express.Router();

// // Get current portfolio
// router.get('/', async (req, res) => {
//   try {
//     const { exchange = 'NSE', source = 'google' } = req.query;
//     const portfolio = await calculatePortfolio(exchange, source);
//     res.json({ success: true, data: portfolio });
//   } catch (error) {
//     res.status(500).json({ success: false, error: error.message });
//   }
// });

// // Get last cached portfolio (instant)
// router.get('/cached', (req, res) => {
//   const data = getLastPortfolioData();
//   if (data) {
//     res.json({ success: true, data });
//   } else {
//     res.status(404).json({ success: false, error: 'No data available yet' });
//   }
// });

// Get portfolio by category
// router.get('/categories', async (req, res) => {
//   try {
//     const data = getLastPortfolioData();
//     if (!data) {
//       return res.status(404).json({ success: false, error: 'No data available' });
//     }
//     const categories = getPortfolioByCategory(data);
//     res.json({ success: true, data: categories });
//   } catch (error) {
//     res.status(500).json({ success: false, error: error.message });
//   }
// });

export default router;