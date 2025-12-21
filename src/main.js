import express from 'express';
import { createServer } from 'http';
import { startPortfolioUpdates } from './schedular/portfolio-updater.js';
import { initCache } from './config/cache-config.js';
import router from './routes/index.js';
import cors from 'cors';

const app = express();

// CORS middleware - allowing access from our frontend and local dev environments
app.use(cors({
  origin: (origin, callback) => {
    callback(null, true); // allow all origins
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 204
}));


app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/', router);

// Start server
async function startServer() {
  try {
    const host = process.env.HOST || '0.0.0.0';
    const port = process.env.PORT || 8000;

    // Create HTTP server
    const httpServer = createServer(app);

    // Start the server and let the world know we're alive
    httpServer.listen(port, host, () => {
      initCache()
      // Refresh stocks updates every 60 seconds - keep it fresh!
      startPortfolioUpdates(60);
      console.log(`🚀 Server is flying on http://${host}:${port}`);
    });
  } catch (error) {
    console.error('Failed to start:', error.message);
    process.exit(1);
  }
}

// Graceful shutdown - cleaning up before we leave
process.on('SIGINT', () => {
  console.log(' SIGINT received. Closing down gracefully...');
  try {
    // Add any cleanup logic here (db connections, etc)
    process.exit(0);
  } catch (err) {
    console.error('Error during shutdown:', err);
    process.exit(1);
  }
});

startServer();

export default app;