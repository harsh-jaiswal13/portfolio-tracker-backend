import express from 'express';
import stockRoute from './stock-routes.js';
// import portfolioRoute from './portfolio-routes.js';
const router = express.Router();

router.use('/api/stocks', stockRoute);

export default router;
