import { getUserPortfolioData } from '../services/portfolio-service.js';

export const getStock = async (req, res) => {

  try {
    const { id } = req.params;
    const data = await getUserPortfolioData(id);
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({
      error: 'Failed to fetch stock data',
      message: error.message,
    });
  }
};
